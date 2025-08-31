// chat-web/lib/crypto/senderKeyRatchet.ts
import nacl from "tweetnacl";
import { encode as b64enc, decode as b64dec } from "base64-arraybuffer";
import { get, set, del } from "idb-keyval";

/**
 * SenderKeyRecord (persistent)
 * - keyId: uuid
 * - chainKeyB64: base64 32 bytes
 * - signPublicB64 / signPrivateB64: ed25519 keypair (base64)
 * - createdAt
 */
export type SenderKeyRecord = {
  keyId: string;
  chainKeyB64: string;
  signPublicB64: string;
  signPrivateB64: string;
  createdAt: string;
};

/** Per-sender runtime info stored separately:
 * senderstate:{user}:{device}:{keyId} -> { counter: number, chainKeyB64: string }
 * We keep both record and state so state.counter can change.
 */
const MAX_SKIP = 2000; // maximum messages to skip/iterate

const subtle = (globalThis as any).crypto?.subtle;

/* ---------- helper: HKDF-SHA256 to derive 64 bytes -> [msgKey(32), nextChainKey(32)] ---------- */
async function hkdfExpand(chainKeyRaw: ArrayBuffer, info: Uint8Array, length = 64): Promise<ArrayBuffer> {
  // WebCrypto HKDF deriveBits
  // salt = chainKeyRaw, info = provided, hash SHA-256
  const salt = new Uint8Array(chainKeyRaw);
  const ikm = chainKeyRaw; // input keying material
  const baseKey = await subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const derived = await subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    baseKey,
    length * 8
  );
  return derived;
}

function u32ToBE(n: number) {
  const buf = new ArrayBuffer(4);
  const dv = new DataView(buf);
  dv.setUint32(0, n, false); // big-endian
  return new Uint8Array(buf);
}

/* ---------- create a new SenderKeyRecord and initial state ---------- */
export async function createSenderKeyRecord(): Promise<SenderKeyRecord> {
  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  const keypair = nacl.sign.keyPair();
  const rec: SenderKeyRecord = {
    keyId: crypto.randomUUID(),
    chainKeyB64: b64enc(keyBytes.buffer),
    signPublicB64: b64enc(new Uint8Array(keypair.publicKey).buffer),
    signPrivateB64: b64enc(new Uint8Array(keypair.secretKey).buffer),
    createdAt: new Date().toISOString()
  };
  return rec;
}

/* ---------- storage helpers ---------- */
export async function storeSenderKeyRecord(recUserId: string, recDeviceId: string, rec: SenderKeyRecord) {
  const k = `senderkey:${recUserId}:${recDeviceId}:${rec.keyId}:record`;
  await set(k, rec);
  // initialize state if not present
  const stateKey = `senderkey:${recUserId}:${recDeviceId}:${rec.keyId}:state`;
  const existing = await get(stateKey);
  if (!existing) {
    await set(stateKey, { counter: 0, chainKeyB64: rec.chainKeyB64 });
  }
}

export async function getSenderKeyRecord(recUserId: string, recDeviceId: string, keyId: string): Promise<SenderKeyRecord|undefined> {
  return await get(`senderkey:${recUserId}:${recDeviceId}:${keyId}:record`);
}

async function getSenderKeyState(recUserId: string, recDeviceId: string, keyId: string) {
  return await get(`senderkey:${recUserId}:${recDeviceId}:${keyId}:state`);
}
async function setSenderKeyState(recUserId: string, recDeviceId: string, keyId: string, state: any) {
  return await set(`senderkey:${recUserId}:${recDeviceId}:${keyId}:state`, state);
}
async function delSenderKey(recUserId: string, recDeviceId: string, keyId: string) {
  await del(`senderkey:${recUserId}:${recDeviceId}:${keyId}:record`);
  await del(`senderkey:${recUserId}:${recDeviceId}:${keyId}:state`);
}

/* ---------- ratchet step: derive [messageKey, nextChainKey] given chainKey + keyId + counter ---------- */
async function deriveKeys(chainKeyB64: string, keyId: string, counter: number) {
  const chainKeyRaw = b64dec(chainKeyB64);
  // info = keyId || counter (utf8 keyId + 4-byte BE counter)
  const keyIdBytes = new TextEncoder().encode(keyId);
  const counterBytes = u32ToBE(counter);
  const info = new Uint8Array(keyIdBytes.length + counterBytes.length);
  info.set(keyIdBytes, 0);
  info.set(counterBytes, keyIdBytes.length);
  const derived = await hkdfExpand(chainKeyRaw, info, 64); // 64 bytes => 32 msgKey, 32 nextChainKey
  const dv = new Uint8Array(derived);
  const msgKey = dv.slice(0, 32).buffer;
  const nextChainKey = dv.slice(32, 64).buffer;
  return { msgKey, nextChainKey };
}

/* ---------- encrypt using ratchet ---------- */
export async function encryptWithSenderKeyRatchet(
  recUserId: string, recDeviceId: string, keyId: string, plaintext: string
) {
  // load state
  const state = await getSenderKeyState(recUserId, recDeviceId, keyId);
  if (!state) throw new Error("sender key state not found");
  const counter = state.counter ?? 0;
  const chainKeyB64 = state.chainKeyB64;

  // derive keys for current counter
  const { msgKey, nextChainKey } = await deriveKeys(chainKeyB64, keyId, counter);

  // AES-GCM with random iv
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await subtle.importKey("raw", msgKey, { name: "AES-GCM" }, false, ["encrypt"]);
  const pt = new TextEncoder().encode(plaintext);
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, key, pt);

  // signing: Ed25519 sign (iv || counter || ct)
  const rec = await getSenderKeyRecord(recUserId, recDeviceId, keyId);
  if (!rec) throw new Error("sender record missing for signing");
  const sigKey = new Uint8Array(b64dec(rec.signPrivateB64));
  const combined = new Uint8Array(iv.byteLength + 4 + ct.byteLength);
  combined.set(iv, 0);
  combined.set(u32ToBE(counter), iv.byteLength);
  combined.set(new Uint8Array(ct), iv.byteLength + 4);
  const sig = nacl.sign.detached(combined, sigKey);

  // persist next chainKey and increment counter
  const nextChainKeyB64 = b64enc(nextChainKey);
  await setSenderKeyState(recUserId, recDeviceId, keyId, { counter: counter + 1, chainKeyB64: nextChainKeyB64 });

  // return bundle
  return {
    keyId,
    counter,
    ivB64: b64enc(iv.buffer),
    ctB64: b64enc(ct),
    sigB64: b64enc(new Uint8Array(sig).buffer)
  };
}

/* ---------- decrypt using ratchet ---------- */
export async function decryptWithSenderKeyRatchet(
  senderUserId: string, senderDeviceId: string, keyId: string,
  counter: number, ivB64: string, ctB64: string, sigB64: string
) {
  const rec = await getSenderKeyRecord(senderUserId, senderDeviceId, keyId);
  if (!rec) throw new Error("missing senderkey record");

  const state = await getSenderKeyState(senderUserId, senderDeviceId, keyId);
  if (!state) throw new Error("missing senderkey state");

  let localCounter = state.counter ?? 0;
  let chainKeyB64 = state.chainKeyB64;

  if (counter < localCounter) {
    // message older than our counter — we do not cache old message keys in this simple demo
    throw new Error("message counter is older than local state (replay/duplicate)");
  }

  const skip = counter - localCounter;
  if (skip > MAX_SKIP) throw new Error(`message counter too far ahead (${skip} > ${MAX_SKIP}). request re-sync`);

  // iterate chainKey until we reach the requested counter
  for (let i = 0; i < skip; i++) {
    const { msgKey, nextChainKey } = await deriveKeys(chainKeyB64, keyId, localCounter + i);
    // we don't need to store msgKey for skipped messages in this simple implementation
    chainKeyB64 = b64enc(nextChainKey);
  }

  // now derive message key for target counter
  const { msgKey, nextChainKey } = await deriveKeys(chainKeyB64, keyId, counter);

  // verify signature: iv||counter||ct
  const iv = new Uint8Array(b64dec(ivB64));
  const ct = b64dec(ctB64);
  const sig = new Uint8Array(b64dec(sigB64));
  const combined = new Uint8Array(iv.byteLength + 4 + ct.byteLength);
  combined.set(iv, 0);
  combined.set(u32ToBE(counter), iv.byteLength);
  combined.set(new Uint8Array(ct), iv.byteLength + 4);

  const pub = new Uint8Array(b64dec(rec.signPublicB64));
  const ok = nacl.sign.detached.verify(combined, sig, pub);
  if (!ok) throw new Error("invalid signature");

  // decrypt
  const key = await subtle.importKey("raw", msgKey, { name: "AES-GCM" }, false, ["decrypt"]);
  const ptBuf = await subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  const plaintext = new TextDecoder().decode(ptBuf);

  // update stored chainKey and counter: set counter = counter+1, set chainKey = nextChainKey
  await setSenderKeyState(senderUserId, senderDeviceId, keyId, { counter: counter + 1, chainKeyB64: b64enc(nextChainKey) });

  return plaintext;
}
