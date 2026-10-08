/** Atomic encrypted snapshot: reference for a bounded device vault, not an unlimited chat archive. */
import {base64, unbase64} from './attachments';
export interface VaultSnapshot {
  version: 1;
  records: Record<string, string>; // Serialized Signal records and encoded private key DTOs.
  outbox: Record<string, string>; // Exact ciphertext envelopes; retries never re-encrypt.
  inbox: Record<string, string>; // Processed IDs and encrypted-at-rest projections.
}
interface Sealed {iv: string; ciphertext: ArrayBuffer}
export class DeviceVault {
  private key: CryptoKey | null = null;
  private epoch = 0;
  private constructor(private db: IDBDatabase, private scope: string) {}
  static async open(userId: string, deviceId: string) {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(`kwonnet-e2ee:${userId}:${deviceId}`, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('vault');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onblocked = () => reject(new Error('Close other tabs to upgrade encrypted storage'));
    });
    db.onversionchange = () => db.close();
    return new DeviceVault(db, JSON.stringify([userId, deviceId]));
  }
  /** Supply a non-extractable DEK unwrapped using the user's passphrase. Never persist this key. */
  unlock(key: CryptoKey) {
    if (key.algorithm.name !== 'AES-GCM' || key.extractable || !key.usages.includes('decrypt') || !key.usages.includes('encrypt')) throw new Error('Invalid vault key');
    this.key = key; this.epoch++;
  }
  lock() {this.key = null; this.epoch++;}
  async atomic<T>(work: (snapshot: VaultSnapshot) => Promise<T>): Promise<T> {
    if (!navigator.locks) throw new Error('Encrypted messaging requires single-writer storage support');
    return navigator.locks.request(`kwonnet-vault:${this.scope}`, async () => {
      const key = this.key, epoch = this.epoch;
      if (!key) throw new Error('Unlock messaging');
      const sealed = await this.read();
      const aad = new TextEncoder().encode(this.scope);
      const snapshot: VaultSnapshot = sealed ? JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name: 'AES-GCM', iv: unbase64(sealed.iv), additionalData: aad}, key, sealed.ciphertext))) : {version: 1, records: {}, outbox: {}, inbox: {}};
      if (snapshot.version !== 1) throw new Error('Unsupported vault version');
      // All Signal store callbacks must operate on this in-memory snapshot.
      // A failed decrypt/validation/identity check discards the entire draft.
      const result = await work(snapshot);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt({name: 'AES-GCM', iv, additionalData: aad}, key, new TextEncoder().encode(JSON.stringify(snapshot)));
      if (this.epoch !== epoch) throw new Error('Vault locked during operation');
      await this.write({iv: base64(iv), ciphertext}); // Resolves on transaction commit, not put success.
      return result;
    });
  }
  private read(): Promise<Sealed | undefined> {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('vault', 'readonly'), request = tx.objectStore('vault').get('snapshot');
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error ?? new Error('Vault read aborted'));
      tx.onerror = () => reject(tx.error);
    });
  }
  private write(sealed: Sealed): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('vault', 'readwrite');
      tx.objectStore('vault').put(sealed, 'snapshot');
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error ?? new Error('Vault write aborted'));
      tx.onerror = () => reject(tx.error);
    });
  }
}
