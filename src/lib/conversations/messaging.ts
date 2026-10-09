import type { Socket } from 'socket.io-client';
import { SessionCipher, SignalProtocolAddress } from '@privacyresearch/libsignal-protocol-typescript';
import { apiUrl } from '@/config';
import { currentMessagingRuntime, signMessaging } from '@/lib/signal/deviceManager';
import { DraftSignalStore, encryptBatch, decryptAndCommit, Target } from '@/lib/signal/signal';
import { base64, unbase64, encryptAttachment, decryptAttachment, validateImageUploads } from '@/lib/signal/attachments';
import { eventSchema, attachmentSchema, deleteSigningBytes, type MessagingEvent, type MessagingDevice, type MessagingWire, type LocalMessage, type Content } from '@/lib/signal/contracts';
import type { Conversation, ConversationMetadata } from '@/types/conversation';
export class MessageQueuedError extends Error {
    constructor() { super('Message is saved on this browser and will retry when delivery is available.'); }
}
let live: {
    userId: string;
    socket: Socket;
} | undefined;
export function setMessagingSocket(userId: string, socket?: Socket) { live = socket ? { userId, socket } : undefined; }
async function socketRequest<T>(userId: string, event: string, body: unknown): Promise<T | undefined> {
    if (live?.userId !== userId || !live.socket.connected)
        return undefined;
    try {
        const result = await live.socket.timeout(5000).emitWithAck(event, body);
        if (!result?.ok)
            throw new Error(result?.error || 'Messaging unavailable');
        return result;
    }
    catch (error) {
        if (!live?.socket.connected || (error instanceof Error && ['operation has timed out', 'socket has been disconnected'].includes(error.message)))
            return undefined;
        throw error;
    }
}
export async function sendReceiptBatch(userId: string, token: string, conversationId: string, deliveredIds: string[], readIds: string[]) {
    const body = { conversationId, deliveredIds, readIds };
    type Result = { suppressed: boolean; unreadCount?: number; unseenCount?: number; totalUnreadMsg?: number; totalUnseenMsg?: number };
    const result = await socketRequest<Result>(userId, 'receipts:batch', body) ?? await messagingAPI<Result>(userId, token, '/receipts/batch', 'POST', body);
    if (!result.suppressed) {
        const r = currentMessagingRuntime(userId), now = new Date().toISOString();
        await r.vault.atomic(async draft => {
            for (const id of new Set([...deliveredIds, ...readIds])) {
                const key = `receipt:${id}:${userId}`, old = JSON.parse(draft.records[key] ?? 'null');
                draft.records[key] = JSON.stringify({ id, conversationId, userId, deliveredAt: old?.deliveredAt ?? now, readAt: readIds.includes(id) ? now : old?.readAt ?? null });
            }
        });
    }
    return result;
}
export async function syncMessages(userId: string, token: string, conversationId: string, after: string, receiptAfter: string): Promise<SyncResult> { return await socketRequest<SyncResult>(userId, 'messages:sync', { conversationId, after, receiptAfter }) ?? messagingAPI<SyncResult>(userId, token, `/${conversationId}/messages?after=${after}&receiptAfter=${receiptAfter}`); }
export async function messagingAPI<T>(userId: string, token: string, path: string, method = 'GET', body?: unknown): Promise<T> {
    const r = currentMessagingRuntime(userId);
    if (path === '/messages' && method === 'POST') {
        const sent = await socketRequest<T>(userId, 'message:send', body);
        if (sent)
            return sent;
    }
    const binary = body instanceof Blob;
    const response = await fetch(`${apiUrl}/conversations${path}`, { method, credentials: 'include', cache: 'no-store', headers: { Authorization: `Bearer ${token}`, 'X-Messaging-Device': r.deviceId, ...(body ? { 'Content-Type': binary ? 'application/octet-stream' : 'application/json' } : {}) }, body: body ? binary ? body : JSON.stringify(body) : undefined });
    if (!response.ok)
        throw new Error((await response.text()).slice(0, 200) || 'Messaging unavailable');
    return await response.json();
}
export async function enroll(userId: string, token: string) { const r = currentMessagingRuntime(userId); await messagingAPI(userId, token, '/devices', 'POST', r.publicBundle); }
export async function deviceTargets(userId: string, token: string, peerId: string, conversationId: string): Promise<Target[]> {
    const r = currentMessagingRuntime(userId);
    const rosters = await Promise.all([messagingAPI<MessagingDevice[]>(userId, token, `/users/${peerId}/devices`), messagingAPI<MessagingDevice[]>(userId, token, `/users/${userId}/devices`)]);
    const targets = [];
    for (const d of rosters.flat().filter(d => d.deviceId !== r.deviceId)) {
        const open = await r.vault.atomic(async (draft) => new SessionCipher(new DraftSignalStore(draft), new SignalProtocolAddress(`${d.userId}:${d.deviceId}:${conversationId}`, d.signalDeviceId)).hasOpenSession());
        if (open) {
            targets.push({ userId: d.userId, deviceId: d.deviceId, signalDeviceId: d.signalDeviceId, conversationId });
            continue;
        }
        const bundle = await messagingAPI<any>(userId, token, `/devices/${d.deviceId}/claim`, 'POST', { claimId: crypto.randomUUID() });
        if (bundle.identityKey !== d.identityPublic)
            throw new Error('Device identity changed while claiming prekeys');
        targets.push({ userId: d.userId, deviceId: d.deviceId, signalDeviceId: d.signalDeviceId, conversationId, bundle: { registrationId: bundle.registrationId, identityKey: unbase64(bundle.identityKey).buffer, signedPreKey: { keyId: bundle.signedPreKey.keyId, publicKey: unbase64(bundle.signedPreKey.publicKey).buffer, signature: unbase64(bundle.signedPreKey.signature).buffer }, ...(bundle.preKey ? { preKey: { keyId: bundle.preKey.keyId, publicKey: unbase64(bundle.preKey.publicKey).buffer } } : {}) } });
    }
    if (!targets.some(t => t.userId === peerId))
        throw new Error('This user has not set up encrypted messaging yet');
    return targets;
}
export async function flushMessagingOutbox(userId: string, token: string) {
    const r = currentMessagingRuntime(userId);
    const pending = await r.vault.atomic(async (draft) => Object.entries(draft.outbox).map(([id, wire]) => ({ id, envelopes: JSON.parse(wire), event: JSON.parse(draft.records[`event:${id}`]) as MessagingEvent })));
    const failed: string[] = [];
    for (const item of pending) {
        try {
            let accepted: { messageId: string };
            try {
                accepted = await messagingAPI(userId, token, '/messages', 'POST', { conversationId: item.event.conversationId, clientId: item.id, envelopes: item.envelopes });
            }
            catch (error) {
                if (!(error instanceof Error) || !error.message.includes('Device roster changed'))
                    throw error;
                // Server checks idempotency before roster validation: this error means no prior commit.
                // Preserve existing ciphertext; only newly enrolled targets advance a new session.
                const sync = await messagingAPI<SyncResult>(userId, token, `/${item.event.conversationId}/messages?after=0`);
                const peer = sync.conversation.initiator.id === userId ? sync.conversation.responder.id : sync.conversation.initiator.id;
                const targets = await deviceTargets(userId, token, peer, item.event.conversationId);
                const envelopes = await encryptBatch(r.vault, item.event, targets, true);
                accepted = await messagingAPI(userId, token, '/messages', 'POST', { conversationId: item.event.conversationId, clientId: item.id, envelopes });
            }
            await r.vault.atomic(async (draft) => {
                // Keep a local projection between relay acceptance and ciphertext sync.
                // Removing only the outbox entry creates a visible gap on slow networks.
                if (['text', 'media'].includes(item.event.content.kind) && !draft.records[`wire:${accepted.messageId}`])
                    draft.records[`sent:${item.id}`] = JSON.stringify({ conversationId: item.event.conversationId });
                delete draft.outbox[item.id];
            });
        }
        catch {
            failed.push(item.id);
        }
    }
    if (failed.length)
        throw new Error('Some encrypted messages remain queued on this browser');
}
export async function sendContent(userId: string, token: string, peerId: string, conversationId: string, content: Content, eventId = crypto.randomUUID()) {
    const r = currentMessagingRuntime(userId);
    const event: MessagingEvent = { v: 2, eventId, conversationId, senderId: userId, senderDeviceId: r.deviceId, createdAt: new Date().toISOString(), content };
    if (content.kind === 'delete')
        content.signature = await signMessaging(deleteSigningBytes(event, content.targetId, content.targetHash));
    eventSchema.parse(event);
    const targets = await deviceTargets(userId, token, peerId, conversationId);
    await encryptBatch(r.vault, event, targets);
    try {
        await flushMessagingOutbox(userId, token);
    }
    catch {
        if (await r.vault.atomic(async (draft) => Boolean(draft.outbox[event.eventId])))
            throw new MessageQueuedError();
    }
    return event;
}
export async function sendMedia(userId: string, token: string, peerId: string, conversationId: string, files: File[], text: string, reply?: {
    targetId: string;
    targetHash: string;
}, eventId = crypto.randomUUID()) {
    validateImageUploads(files);
    const attachments = [];
    for (const file of files) {
        const blobId = crypto.randomUUID();
        const { blob, secret } = await encryptAttachment(file, conversationId, blobId);
        const grant = await messagingAPI<{
            url?: string;
            headers?: Record<string, string>;
            finalized: boolean;
        }>(userId, token, `/${conversationId}/blobs`, 'POST', { blobId, ciphertextBytes: secret.ciphertextBytes, ciphertextSha256: secret.ciphertextSha256B64 });
        if (!grant.finalized) {
            if (!grant.url)
                throw new Error('Upload grant unavailable');
            const upload = await fetch(grant.url, { method: 'PUT', headers: grant.headers, body: blob, credentials: 'omit', referrerPolicy: 'no-referrer' });
            if (!upload.ok && upload.status !== 412)
                throw new Error('Encrypted upload failed');
            await messagingAPI(userId, token, `/${conversationId}/blobs/${blobId}/finalize`, 'POST', {});
        }
        attachments.push(attachmentSchema.parse(secret));
    }
    return sendContent(userId, token, peerId, conversationId, { kind: 'media', text, attachments, reply }, eventId);
}
export async function loadMedia(userId: string, token: string, conversationId: string, secret: NonNullable<LocalMessage['attachments']>[number]) {
    const r = currentMessagingRuntime(userId);
    const response = await fetch(`${apiUrl}/conversations/${conversationId}/blobs/${secret.blobId}`, { credentials: 'include', headers: { Authorization: `Bearer ${token}`, 'X-Messaging-Device': r.deviceId }, cache: 'no-store' });
    if (!response.ok)
        throw new Error('Attachment unavailable');
    if (response.headers.get('content-type')?.includes('application/json')) {
        const grant = await response.json();
        const bytes = await fetch(grant.url, { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
        if (!bytes.ok)
            throw new Error('Attachment unavailable');
        return decryptAttachment(secret, await bytes.arrayBuffer(), conversationId);
    }
    return decryptAttachment(secret, await response.arrayBuffer(), conversationId);
}
async function eventHash(event: MessagingEvent) { return base64(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(event))))); }
export interface SyncResult {
    accountTotals?: { totalUnreadMsg: number; totalUnseenMsg: number };
    messages: MessagingWire[];
    receipts: {
        id: string;
        eventId: string;
        userId: string;
        status: 'DELIVERED' | 'READ';
        deliveredAt: string;
        readAt: string | null;
    }[];
    nextCursor: string;
    nextReceiptCursor: string;
    conversation: ConversationMetadata;
}
export async function decryptWire(userId: string, wire: MessagingWire): Promise<{
    wire: MessagingWire;
    event: MessagingEvent;
    hash: string;
}> {
    const r = currentMessagingRuntime(userId);
    const validate = async (input: unknown, draft: import('@/lib/signal/vault').VaultSnapshot) => {
        const event = eventSchema.parse(input);
        if (event.eventId !== wire.eventId || event.conversationId !== wire.conversation || event.senderId !== wire.fromUserId || event.senderDeviceId !== wire.fromDeviceId)
            throw new Error('Message context mismatch');
        const pin = `action-pin:${wire.fromUserId}:${wire.fromDeviceId}`;
        if (draft.records[pin] && draft.records[pin] !== wire.senderActionSigningPublic)
            throw new Error('Device signing identity changed');
        if (event.content.kind === 'delete') {
            const key = await crypto.subtle.importKey('raw', unbase64(wire.senderActionSigningPublic), 'Ed25519', false, ['verify']);
            if (!await crypto.subtle.verify('Ed25519', key, unbase64(event.content.signature), deleteSigningBytes(event, event.content.targetId, event.content.targetHash)))
                throw new Error('Invalid deletion signature');
        }
        draft.records[pin] = wire.senderActionSigningPublic;
        draft.records[`wire:${wire.id}`] = JSON.stringify(wire);
        draft.records[`event:${event.eventId}`] = JSON.stringify(event);
        delete draft.records[`sent:${event.eventId}`];
        delete draft.records[`failed:${wire.id}`];
        return event;
    };
    const event = wire.ownDevice ? await r.vault.atomic(async (draft) => validate(JSON.parse(draft.records[`event:${wire.eventId}`] ?? 'null'), draft)) : await decryptAndCommit(r.vault, wire.id, { userId: wire.fromUserId, deviceId: wire.fromDeviceId, signalDeviceId: wire.senderSignalDeviceId, conversationId: wire.conversation, identityPublic: wire.senderIdentityPublic }, { recipientDeviceId: r.deviceId, wireType: wire.wireType, ciphertextB64: wire.ciphertextB64 }, validate);
    return { wire, event, hash: await eventHash(event) };
}
export async function localConversation(userId: string, conversationId: string, peerId: string): Promise<LocalMessage[]> {
    const r = currentMessagingRuntime(userId);
    const records = await r.vault.atomic(async (draft) => ({ wires: Object.entries(draft.records).filter(([k]) => k.startsWith('wire:')).map(([, v]) => JSON.parse(v) as MessagingWire).filter(w => w.conversation === conversationId), events: draft.records, hidden: draft.records[`hidden:${conversationId}`] ?? '[]', pending: [...new Set([...Object.keys(draft.outbox), ...Object.keys(draft.records).filter(key => key.startsWith('sent:')).map(key => key.slice(5))])], queued: new Set(Object.keys(draft.outbox)), failed: Object.entries(draft.records).filter(([k]) => k.startsWith('failed:')).map(([, v]) => JSON.parse(v) as MessagingWire) }));
    const hidden = new Set(JSON.parse(records.hidden) as string[]);
    const messages: LocalMessage[] = [];
    const map = new Map<string, LocalMessage>();
    const receiptMap = new Map<string, { userId: string; deliveredAt: string; readAt?: string }[]>();
    for (const [key, value] of Object.entries(records.events)) {
        if (!key.startsWith('receipt:')) continue;
        const receipt = JSON.parse(value);
        if (receipt.conversationId === conversationId) receiptMap.set(receipt.id, [...(receiptMap.get(receipt.id) ?? []), receipt]);
    }
    for (const wire of records.wires) {
        for (const receipt of receiptMap.get(wire.id) ?? []) {
            wire.seen = wire.seen.filter(value => value.userId !== receipt.userId).concat({ userId: receipt.userId, seenAt: receipt.deliveredAt });
            if (receipt.readAt) wire.read = wire.read.filter(value => value.userId !== receipt.userId).concat({ userId: receipt.userId, readAt: receipt.readAt });
        }
    }
    for (const wire of records.wires.sort((a, b) => BigInt(a.serverSequence) < BigInt(b.serverSequence) ? -1 : 1)) {
        const event = eventSchema.parse(JSON.parse(records.events[`event:${wire.eventId}`]));
        const c = event.content;
        if (c.kind === 'text' || c.kind === 'media') {
            const m: LocalMessage = { ...wire, toUserId: event.senderId === userId ? peerId : userId, event, hash: await eventHash(event), content: c.text, attachments: c.kind === 'media' ? c.attachments : undefined, reply: c.reply, reactions: [], deleted: false, revision: 0 };
            map.set(event.eventId, m);
            messages.push(m);
        }
        else {
            const target = map.get(c.targetId);
            if (!target || target.hash !== c.targetHash)
                continue;
            if (c.kind === 'reaction' && !target.deleted) {
                target.reactions = target.reactions.filter(r => !(r.userId === event.senderId && r.reaction === c.emoji));
                if (!c.remove)
                    target.reactions.push({ userId: event.senderId, reaction: c.emoji });
            }
            if (c.kind === 'edit' && !target.deleted && target.fromUserId === event.senderId && c.revision === target.revision + 1) {
                target.content = c.text;
                target.revision = c.revision;
            }
            if (c.kind === 'delete' && target.fromUserId === event.senderId) {
                const key = await crypto.subtle.importKey('raw', unbase64(wire.senderActionSigningPublic), 'Ed25519', false, ['verify']);
                if (await crypto.subtle.verify('Ed25519', key, unbase64(c.signature), deleteSigningBytes(event, c.targetId, c.targetHash))) {
                    target.deleted = true;
                    target.content = 'Message deleted';
                    target.attachments = undefined;
                    target.reactions = [];
                }
            }
        }
    }
    for (const eventId of records.pending) {
        const event = eventSchema.parse(JSON.parse(records.events[`event:${eventId}`]));
        const c = event.content;
        if (event.conversationId !== conversationId || (c.kind !== 'text' && c.kind !== 'media') || map.has(eventId))
            continue;
        const queued = records.queued.has(eventId);
        messages.push({ id: eventId, eventId, conversation: conversationId, fromUserId: userId, fromDeviceId: event.senderDeviceId, senderSignalDeviceId: 0, senderActionSigningPublic: '', senderIdentityPublic: '', toUserId: peerId, toDeviceId: '', serverSequence: '0', createdAt: event.createdAt, wireType: 1, ciphertextB64: '', seen: [], read: [], event, hash: await eventHash(event), content: c.text, attachments: c.kind === 'media' ? c.attachments : undefined, reply: c.reply, reactions: [], deleted: false, revision: 0, queued, sendingState: queued ? undefined : 'sent' });
    }
    for (const wire of records.failed.filter(w => w.conversation === conversationId)) {
        if (messages.some(m => m.id === wire.id))
            continue;
        const event: MessagingEvent = { v: 2, eventId: wire.eventId, conversationId, senderId: wire.fromUserId, senderDeviceId: wire.fromDeviceId, createdAt: wire.createdAt, content: { kind: 'text', text: 'Encrypted message could not be authenticated' } };
        messages.push({ ...wire, toUserId: wire.fromUserId === userId ? peerId : userId, event, hash: '', content: event.content.kind === 'text' ? event.content.text : '', reactions: [], deleted: false, revision: 0, integrityFailed: true });
    }
    return messages.filter(m => !hidden.has(m.id));
}
export async function forgetConversation(userId: string, conversationId: string) {
    const r = currentMessagingRuntime(userId);
    await r.vault.atomic(async (draft) => {
        for (const [key, value] of Object.entries(draft.records)) {
            if (key.startsWith('session:') && key.includes(`:${conversationId}.`))
                delete draft.records[key];
            if (key.startsWith('receipt:') && JSON.parse(value).conversationId === conversationId) delete draft.records[key];
            if ((key.startsWith('wire:') || key.startsWith('failed:')) && JSON.parse(value).conversation === conversationId)
                delete draft.records[key];
            if (key.startsWith('event:') && JSON.parse(value).conversationId === conversationId) {
                delete draft.outbox[key.slice(6)];
                delete draft.records[`sent:${key.slice(6)}`];
                delete draft.records[key];
            }
        }
        for (const [key, value] of Object.entries(draft.inbox))
            if (JSON.parse(value).conversationId === conversationId)
                delete draft.inbox[key];
        delete draft.records[`cursor:${conversationId}`];
        delete draft.records[`receipt-cursor:${conversationId}`];
        delete draft.records[`hidden:${conversationId}`];
    });
}
export async function hideMessage(userId: string, token: string, conversationId: string, messageId: string) {
    await messagingAPI(userId, token, `/${conversationId}/messages/${messageId}`, 'DELETE');
    const r = currentMessagingRuntime(userId);
    await r.vault.atomic(async (draft) => { const key = `hidden:${conversationId}`; draft.records[key] = JSON.stringify([...new Set([...(JSON.parse(draft.records[key] ?? '[]') as string[]), messageId])]); });
}
export async function resetLocalMessaging(userId: string, token: string) {
    const { storedMessagingDeviceId, resetMessagingDevice } = await import('@/lib/signal/deviceManager');
    const deviceId = await storedMessagingDeviceId(userId);
    if (deviceId) {
        // Revocation needs account authentication, not the lost messaging passphrase.
        const response = await fetch(`${apiUrl}/conversations/devices/${deviceId}/revoke`, {
            method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok)
            throw new Error('Revoke this device before resetting its messaging keys');
    }
    await resetMessagingDevice(userId);
}
