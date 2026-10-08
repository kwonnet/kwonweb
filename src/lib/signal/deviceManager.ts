import { get, set, del } from 'idb-keyval';
import { KeyHelper } from '@privacyresearch/libsignal-protocol-typescript';
import { DeviceVault } from './vault';
import { DraftSignalStore } from './signal';
import { base64, unbase64 } from './attachments';
interface VaultConfig {
    version: 2;
    deviceId: string;
    salt: string;
    iv: string;
    wrappedKey: string;
}
export interface MessagingRuntime {
    userId: string;
    deviceId: string;
    vault: DeviceVault;
    publicBundle: any;
}
let runtime: MessagingRuntime | undefined;
export function currentMessagingRuntime(userId: string) {
    if (runtime?.userId !== userId)
        throw new Error('Unlock encrypted messaging');
    return runtime;
}
export function lockMessaging() { runtime?.vault.close(); runtime = undefined; }
export async function hasMessagingVault(userId: string) { return !!await get(`e2-vault:${userId}`); }
async function passwordKey(passphrase: string, salt: Uint8Array<ArrayBuffer>) {
    const raw = await new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
        const worker = new Worker(new URL('./password.worker.ts', import.meta.url));
        const timeout = setTimeout(() => { worker.terminate(); reject(new Error('Key derivation timed out')); }, 60000);
        worker.onmessage = ev => {
            clearTimeout(timeout);
            worker.terminate();
            if (ev.data.error)
                reject(new Error(ev.data.error));
            else
                resolve(ev.data.key);
        };
        worker.onerror = () => { clearTimeout(timeout); worker.terminate(); reject(new Error('Key derivation unavailable')); };
        worker.postMessage({ passphrase, salt });
    });
    const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
    raw.fill(0);
    return key;
}
export async function unlockMessaging(userId: string, passphrase: string): Promise<MessagingRuntime> {
    if (passphrase.length < 12)
        throw new Error('Use a messaging passphrase with at least 12 characters');
    if (!navigator.locks)
        throw new Error('This browser does not support secure messaging storage');
    return navigator.locks.request(`kwonnet-enroll:${userId}`, async () => {
        let config = await get<VaultConfig>(`e2-vault:${userId}`);
        if (config && config.version !== 2)
            throw new Error('Unsupported messaging vault');
        const deviceId = config?.deviceId ?? crypto.randomUUID();
        const salt = config ? unbase64(config.salt) : crypto.getRandomValues(new Uint8Array(16));
        if (salt.length !== 16)
            throw new Error('Invalid vault salt');
        const wrapping = await passwordKey(passphrase, salt);
        const aad = new TextEncoder().encode(JSON.stringify(['kwonnet-vault-key', 2, userId, deviceId]));
        let raw: Uint8Array<ArrayBuffer>;
        if (config) {
            try {
                raw = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unbase64(config.iv), additionalData: aad }, wrapping, unbase64(config.wrappedKey)));
            }
            catch {
                throw new Error('Incorrect messaging passphrase');
            }
        }
        else
            raw = crypto.getRandomValues(new Uint8Array(32));
        const dek = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
        if (!config) {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            config = { version: 2, deviceId, salt: base64(salt), iv: base64(iv), wrappedKey: base64(new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, wrapping, raw))) };
            await set(`e2-vault:${userId}`, config);
        }
        raw.fill(0);
        const vault = await DeviceVault.open(userId, deviceId);
        vault.unlock(dek);
        const publicBundle = await vault.atomic(async (draft) => {
            if (draft.records['local:bundle']) {
                const bundle = JSON.parse(draft.records['local:bundle']);
                const store = new DraftSignalStore(draft);
                const remaining = Object.keys(draft.records).filter(k => k.startsWith('prekey:')).length;
                if (remaining < 20) {
                    const start = Number(draft.records['local:next-prekey'] ?? 51);
                    bundle.preKeys = [];
                    for (let keyId = start; keyId < start + 50; keyId++) {
                        const pre = await KeyHelper.generatePreKey(keyId);
                        await store.storePreKey(keyId, pre.keyPair);
                        bundle.preKeys.push({ keyId, publicKey: base64(new Uint8Array(pre.keyPair.pubKey)) });
                    }
                    draft.records['local:next-prekey'] = String(start + 50);
                }
                const last = Number(draft.records['local:signed-at'] ?? 0);
                if (Date.now() - last > 30 * 86400000) {
                    const keyId = bundle.signedPreKey.keyId + 1;
                    const identity = await store.getIdentityKeyPair();
                    if (!identity)
                        throw new Error('Device identity unavailable');
                    const signed = await KeyHelper.generateSignedPreKey(identity, keyId);
                    await store.storeSignedPreKey(keyId, signed.keyPair);
                    bundle.signedPreKey = { keyId, publicKey: base64(new Uint8Array(signed.keyPair.pubKey)), signature: base64(new Uint8Array(signed.signature)) };
                    draft.records['local:signed-at'] = String(Date.now());
                    draft.records[`local:signed-date:${keyId}`] = String(Date.now());
                }
                for (const [key, value] of Object.entries(draft.records)) {
                    if (key.startsWith('local:signed-date:') && Date.now() - Number(value) > 90 * 86400000) {
                        const id = Number(key.split(':').at(-1));
                        if (id !== bundle.signedPreKey.keyId) {
                            await store.removeSignedPreKey(id);
                            delete draft.records[key];
                        }
                    }
                }
                draft.records['local:bundle'] = JSON.stringify(bundle);
                return bundle;
            }
            const identity = await KeyHelper.generateIdentityKeyPair(), registrationId = KeyHelper.generateRegistrationId();
            const store = new DraftSignalStore(draft);
            store.initialize(identity, registrationId);
            const signed = await KeyHelper.generateSignedPreKey(identity, 1);
            await store.storeSignedPreKey(1, signed.keyPair);
            const preKeys = [];
            for (let keyId = 1; keyId <= 50; keyId++) {
                const pre = await KeyHelper.generatePreKey(keyId);
                await store.storePreKey(keyId, pre.keyPair);
                preKeys.push({ keyId, publicKey: base64(new Uint8Array(pre.keyPair.pubKey)) });
            }
            const signing = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
            draft.records['local:action-private'] = base64(new Uint8Array(await crypto.subtle.exportKey('pkcs8', signing.privateKey)));
            const bundle = { deviceId, signalDeviceId: new DataView(crypto.getRandomValues(new Uint8Array(4)).buffer).getUint32(0) % 2147483646 + 1, registrationId, identityPublic: base64(new Uint8Array(identity.pubKey)), actionSigningPublic: base64(new Uint8Array(await crypto.subtle.exportKey('raw', signing.publicKey))), signedPreKey: { keyId: 1, publicKey: base64(new Uint8Array(signed.keyPair.pubKey)), signature: base64(new Uint8Array(signed.signature)) }, preKeys };
            draft.records['local:bundle'] = JSON.stringify(bundle);
            draft.records['local:next-prekey'] = '51';
            draft.records['local:signed-date:1'] = String(Date.now());
            draft.records['local:signed-at'] = String(Date.now());
            return bundle;
        });
        runtime?.vault.lock();
        runtime = { userId, deviceId, vault, publicBundle };
        return runtime;
    });
}
export async function signMessaging(bytes: Uint8Array<ArrayBuffer>) {
    if (!runtime)
        throw new Error('Unlock messaging');
    return runtime.vault.atomic(async (draft) => { const raw = unbase64(draft.records['local:action-private']); const key = await crypto.subtle.importKey('pkcs8', raw, 'Ed25519', false, ['sign']); raw.fill(0); return base64(new Uint8Array(await crypto.subtle.sign('Ed25519', key, bytes))); });
}
export async function resetMessagingDevice(userId: string) {
    lockMessaging();
    const config = await get<VaultConfig>(`e2-vault:${userId}`);
    if (config)
        await new Promise<void>((resolve, reject) => { const request = indexedDB.deleteDatabase(`kwonnet-e2ee:${userId}:${config.deviceId}`); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); request.onblocked = () => reject(new Error('Close other messaging tabs first')); });
    await del(`e2-vault:${userId}`);
}
export async function storedMessagingDeviceId(userId: string) {
    const config = await get<VaultConfig>(`e2-vault:${userId}`);
    return config?.deviceId;
}
