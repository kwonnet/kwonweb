/** Signal storage mutations are committed atomically with ciphertext and local projections. */
import { SessionBuilder, SessionCipher, SignalProtocolAddress, type StorageType, type KeyPairType, type DeviceType, type Direction } from '@privacyresearch/libsignal-protocol-typescript';
import { base64, unbase64 } from './attachments';
import { DeviceVault, type VaultSnapshot } from './vault';
type PairDTO = {
    pubKey: string;
    privKey: string;
};
export class DraftSignalStore implements StorageType {
    constructor(private draft: VaultSnapshot) { }
    // Library checks trust with address.name but saves with address.toString().
    // Address names below include device UUIDs so distinct devices have distinct pins.
    private identityKey(identifier: string) { return `identity:${identifier.replace(/\.\d+$/, '')}`; }
    private pair(key: string): KeyPairType | undefined {
        const value = this.draft.records[key];
        if (!value)
            return undefined;
        const dto: PairDTO = JSON.parse(value);
        return { pubKey: unbase64(dto.pubKey).buffer, privKey: unbase64(dto.privKey).buffer };
    }
    private putPair(key: string, pair: KeyPairType) {
        this.draft.records[key] = JSON.stringify({ pubKey: base64(new Uint8Array(pair.pubKey)), privKey: base64(new Uint8Array(pair.privKey)) });
    }
    async getIdentityKeyPair() { return this.pair('local:identity'); }
    async getLocalRegistrationId() {
        const value = this.draft.records['local:registration'];
        return value === undefined ? undefined : Number(value);
    }
    /** Enrollment: call inside vault.atomic, before publishing any public bundle. */
    initialize(identity: KeyPairType, registrationId: number) {
        if (this.draft.records['local:identity'])
            throw new Error('Device already initialized');
        this.putPair('local:identity', identity);
        this.draft.records['local:registration'] = String(registrationId);
    }
    async isTrustedIdentity(identifier: string, identity: ArrayBuffer, _direction: Direction) {
        const old = this.draft.records[this.identityKey(identifier)];
        // First use is TOFU. Later changes must use a separate explicit approval flow.
        return old === undefined || old === base64(new Uint8Array(identity));
    }
    async saveIdentity(identifier: string, identity: ArrayBuffer) {
        const key = this.identityKey(identifier), next = base64(new Uint8Array(identity));
        const old = this.draft.records[key];
        if (old !== undefined && old !== next)
            throw new Error('Peer identity changed; verification required');
        this.draft.records[key] = next;
        return false; // No existing identity was replaced.
    }
    async loadPreKey(id: string | number) { return this.pair(`prekey:${id}`); }
    async storePreKey(id: string | number, pair: KeyPairType) { this.putPair(`prekey:${id}`, pair); }
    async removePreKey(id: string | number) { delete this.draft.records[`prekey:${id}`]; }
    async loadSignedPreKey(id: string | number) { return this.pair(`signed-prekey:${id}`); }
    async storeSignedPreKey(id: string | number, pair: KeyPairType) { this.putPair(`signed-prekey:${id}`, pair); }
    async removeSignedPreKey(id: string | number) { delete this.draft.records[`signed-prekey:${id}`]; }
    async loadSession(address: string) { return this.draft.records[`session:${address}`]; }
    async storeSession(address: string, record: string) { this.draft.records[`session:${address}`] = record; }
}
export interface Target {
    userId: string;
    deviceId: string;
    signalDeviceId: number;
    conversationId: string;
    identityPublic?: string;
    bundle?: DeviceType<ArrayBuffer>; // Verified signed bundle from an authorized directory claim.
}
export interface EncryptedWire {
    recipientDeviceId: string;
    wireType: 1 | 3;
    ciphertextB64: string;
}
export async function encryptBatch(vault: DeviceVault, event: {
    eventId: string;
    conversationId: string;
}, targets: Target[], reconcileUncommittedRoster = false) {
    if (!targets.length || targets.length > 20 || new Set(targets.map(t => t.deviceId)).size !== targets.length)
        throw new Error('Invalid device roster');
    return vault.atomic(async (draft) => {
        const prior: EncryptedWire[] = draft.outbox[event.eventId] ? JSON.parse(draft.outbox[event.eventId]) : [];
        if (prior.length && !reconcileUncommittedRoster)
            return prior;
        const store = new DraftSignalStore(draft), envelopes: EncryptedWire[] = prior.filter(e => targets.some(t => t.deviceId === e.recipientDeviceId));
        for (const target of targets) {
            if (envelopes.some(e => e.recipientDeviceId === target.deviceId))
                continue;
            const address = new SignalProtocolAddress(`${target.userId}:${target.deviceId}:${target.conversationId}`, target.signalDeviceId);
            const cipher = new SessionCipher(store, address);
            if (!await cipher.hasOpenSession()) {
                if (!target.bundle)
                    throw new Error('Verified prekey bundle required');
                await new SessionBuilder(store, address).processPreKey(target.bundle);
            }
            const bytes = new TextEncoder().encode(JSON.stringify(event));
            const message = await cipher.encrypt(bytes.buffer);
            if (!message.body || (message.type !== 1 && message.type !== 3))
                throw new Error('Unsupported Signal envelope');
            envelopes.push({ recipientDeviceId: target.deviceId, wireType: message.type, ciphertextB64: btoa(message.body) });
        }
        draft.outbox[event.eventId] = JSON.stringify(envelopes);
        draft.records[`event:${event.eventId}`] = JSON.stringify(event);
        return envelopes;
    });
}
export async function decryptAndCommit<T>(vault: DeviceVault, messageId: string, sender: Target, envelope: EncryptedWire, validateContext: (value: unknown, draft: VaultSnapshot) => T | Promise<T>): Promise<T> {
    return vault.atomic(async (draft) => {
        if (draft.inbox[messageId])
            return await validateContext(JSON.parse(draft.inbox[messageId]), draft);
        if (envelope.ciphertextB64.length > 90000)
            throw new Error('Envelope too large');
        const bytes = unbase64(envelope.ciphertextB64).buffer;
        const store=new DraftSignalStore(draft);
        const address=new SignalProtocolAddress(`${sender.userId}:${sender.deviceId}:${sender.conversationId}`,sender.signalDeviceId);
        // Bind the prekey message's embedded sender identity to authenticated enrollment.
        if(sender.identityPublic)await store.saveIdentity(address.toString(),unbase64(sender.identityPublic).buffer);
        const cipher = new SessionCipher(store,address);
        const plaintext = envelope.wireType === 3 ? await cipher.decryptPreKeyWhisperMessage(bytes)
            : envelope.wireType === 1 ? await cipher.decryptWhisperMessage(bytes) : (() => { throw new Error('Unsupported wire type'); })();
        const parsed: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext));
        const event = await validateContext(parsed, draft); // MUST validate IDs, peer binding and strict content schema.
        draft.inbox[messageId] = JSON.stringify(event);
        return event;
    });
}
