/** Portable history only: never export device private keys, ratchets or retry queues. */
import { z } from 'zod';
import { base64, unbase64 } from './attachments';
import { eventSchema, deleteSigningBytes, type MessagingWire } from './contracts';
import { currentMessagingRuntime, messagingPassphraseKey } from './deviceManager';

const MAX_PLAINTEXT = 32 * 1024 * 1024;
export const MAX_HISTORY_FILE_BYTES = 48 * 1024 * 1024;
const uuid = z.string().uuid();
const account = z.string().min(1).max(100);
const wireSchema = z.object({
  id: uuid, eventId: uuid, conversation: uuid, fromUserId: account, fromDeviceId: uuid,
  senderSignalDeviceId: z.number().int().min(1).max(2147483647),
  senderActionSigningPublic: z.string().length(44), senderIdentityPublic: z.string().max(48),
  toUserId: account, toDeviceId: uuid, serverSequence: z.string().regex(/^\d{1,20}$/),
  createdAt: z.string().datetime(),
  seen: z.array(z.object({userId: account, seenAt: z.string().datetime()}).strict()).max(100),
  read: z.array(z.object({userId: account, readAt: z.string().datetime()}).strict()).max(100),
}).strict();
const historySchema = z.object({
  version: z.literal(1), userId: account, sourceDeviceId: uuid, exportedAt: z.string().datetime(),
  entries: z.array(z.object({wire: wireSchema, event: eventSchema}).strict()).max(50000),
  hidden: z.array(z.object({conversationId: uuid, ids: z.array(uuid).max(50000)}).strict()).max(50000),
}).strict();
type History = z.infer<typeof historySchema>;
const sealedSchema = z.object({
  format: z.literal('kwonnet-history'), version: z.literal(1),
  kdf: z.literal('argon2id-3-64m'), salt: z.string().length(24), iv: z.string().length(16),
  ciphertext: z.string().max(MAX_HISTORY_FILE_BYTES),
}).strict();
const aad = (userId: string) => new TextEncoder().encode(JSON.stringify(['kwonnet-history', 1, 'argon2id-3-64m', userId]));

async function validateHistory(value: unknown, userId: string) {
  const history = historySchema.parse(value);
  if (history.userId !== userId) throw new Error('This history belongs to a different account');
  const ids = new Set<string>(), events = new Set<string>();
  for (const {wire, event} of history.entries) {
    if (wire.toUserId !== userId || wire.eventId !== event.eventId || wire.conversation !== event.conversationId ||
        wire.fromUserId !== event.senderId || wire.fromDeviceId !== event.senderDeviceId || ids.has(wire.id) || events.has(event.eventId))
      throw new Error('Invalid history message context');
    ids.add(wire.id); events.add(event.eventId);
    if (unbase64(wire.senderActionSigningPublic).length !== 32 || unbase64(wire.senderIdentityPublic).length !== 33)
      throw new Error('Invalid history device identity');
    if (event.content.kind === 'delete') {
      const key = await crypto.subtle.importKey('raw', unbase64(wire.senderActionSigningPublic), 'Ed25519', false, ['verify']);
      if (!await crypto.subtle.verify('Ed25519', key, unbase64(event.content.signature), deleteSigningBytes(event, event.content.targetId, event.content.targetHash)))
        throw new Error('Invalid history deletion signature');
    }
  }
  return history;
}

export async function exportMessagingHistory(userId: string, passphrase: string): Promise<Blob> {
  const runtime = currentMessagingRuntime(userId);
  const history: History = await runtime.vault.atomic(async draft => {
    const entries: History['entries'] = [];
    for (const [key, value] of Object.entries(draft.records)) {
      if (!key.startsWith('wire:')) continue;
      const wire: MessagingWire = JSON.parse(value);
      if (draft.records[`failed:${wire.id}`]) continue;
      const event = eventSchema.parse(JSON.parse(draft.records[`event:${wire.eventId}`]));
      const {id, eventId, conversation, fromUserId, fromDeviceId, senderSignalDeviceId, senderActionSigningPublic,
        senderIdentityPublic, toDeviceId, serverSequence, createdAt, seen, read} = wire;
      entries.push({wire: {id, eventId, conversation, fromUserId, fromDeviceId, senderSignalDeviceId,
        senderActionSigningPublic, senderIdentityPublic, toUserId: userId, toDeviceId, serverSequence, createdAt, seen, read}, event});
    }
    const hidden = Object.entries(draft.records).filter(([key]) => key.startsWith('hidden:'))
      .map(([key, value]) => ({conversationId: key.slice(7), ids: JSON.parse(value)}));
    return {version: 1, userId, sourceDeviceId: runtime.deviceId, exportedAt: new Date().toISOString(), entries, hidden};
  });
  await validateHistory(history, userId);
  const plaintext = new TextEncoder().encode(JSON.stringify(history));
  try {
    if (plaintext.byteLength > MAX_PLAINTEXT) throw new Error('History exceeds the 32 MB transfer limit');
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await messagingPassphraseKey(passphrase, salt);
    const ciphertext = await crypto.subtle.encrypt({name: 'AES-GCM', iv, additionalData: aad(userId)}, key, plaintext);
    if (currentMessagingRuntime(userId) !== runtime) throw new Error('Messaging device changed during export');
    return new Blob([JSON.stringify({format: 'kwonnet-history', version: 1, kdf: 'argon2id-3-64m',
      salt: base64(salt), iv: base64(iv), ciphertext: base64(new Uint8Array(ciphertext))})], {type: 'application/json'});
  } finally { plaintext.fill(0); }
}

export async function importMessagingHistory(userId: string, file: Blob, passphrase: string) {
  const runtime = currentMessagingRuntime(userId);
  if (file.size > MAX_HISTORY_FILE_BYTES) throw new Error('History file is too large');
  const sealed = sealedSchema.parse(JSON.parse(await file.text()));
  const salt = unbase64(sealed.salt), iv = unbase64(sealed.iv), ciphertext = unbase64(sealed.ciphertext);
  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length > MAX_PLAINTEXT + 16 || ciphertext.length < 16)
    throw new Error('Invalid encrypted history file');
  const key = await messagingPassphraseKey(passphrase, salt);
  let plaintext: Uint8Array<ArrayBuffer>;
  try {
    plaintext = new Uint8Array(await crypto.subtle.decrypt({name: 'AES-GCM', iv, additionalData: aad(userId)}, key, ciphertext));
  } catch { throw new Error('Incorrect transfer passphrase, different account, or damaged history file'); }
  try {
    const history = await validateHistory(JSON.parse(new TextDecoder().decode(plaintext)), userId);
    if (currentMessagingRuntime(userId) !== runtime) throw new Error('Messaging device changed during restore');
    return await runtime.vault.atomic(async draft => {
      let restored = 0;
      for (const {wire, event} of history.entries) {
        const wireKey = `wire:${wire.id}`, eventKey = `event:${event.eventId}`;
        const pin = `action-pin:${wire.fromUserId}:${wire.fromDeviceId}`;
        if (draft.records[pin] && draft.records[pin] !== wire.senderActionSigningPublic)
          throw new Error('History device signing identity changed');
        if (draft.records[eventKey] && JSON.stringify(eventSchema.parse(JSON.parse(draft.records[eventKey]))) !== JSON.stringify(event))
          throw new Error('History conflicts with an existing message');
        if (draft.records[wireKey]) {
          const existing: MessagingWire = JSON.parse(draft.records[wireKey]);
          if (existing.eventId !== wire.eventId || existing.conversation !== wire.conversation || existing.fromDeviceId !== wire.fromDeviceId)
            throw new Error('History conflicts with an existing message');
          continue; // Never replace more recent receipt/deletion state or native envelopes.
        }
        draft.records[eventKey] = JSON.stringify(event);
        draft.records[pin] = wire.senderActionSigningPublic;
        draft.records[wireKey] = JSON.stringify({...wire, toDeviceId: runtime.deviceId, wireType: 1, ciphertextB64: ''});
        delete draft.records[`failed:${wire.id}`];
        restored++;
      }
      for (const hidden of history.hidden) {
        const key = `hidden:${hidden.conversationId}`;
        draft.records[key] = JSON.stringify([...new Set([...JSON.parse(draft.records[key] ?? '[]'), ...hidden.ids])]);
      }
      return {restored, conversations: new Set(history.entries.map(entry => entry.wire.conversation)).size};
    });
  } finally { plaintext.fill(0); }
}
