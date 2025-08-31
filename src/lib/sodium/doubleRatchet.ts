// app/lib/doubleRatchet.ts
import sodium from "libsodium-wrappers-sumo";
import { set as idbSet, get as idbGet } from "idb-keyval";

/**
 * Type definitions
 */
export type Uint8 = Uint8Array;


export interface Header {
  dhPub_b64: string; // base64 of sender's DH public key for this message (X25519)
  pn: number; // previous chain length
  n: number; // message number within sending chain
}

export interface RatchetState {
  // Root key and chain keys are base64 for easy storage
  RK_b64: string;          // root key (base64)
  DHs: { pub_b64: string; priv_b64: string }; // our current DH keypair
  DHr_b64: string | null; // remote's current DH pub (base64)
  CKs_b64: string | null; // sending chain key (base64)
  CKr_b64: string | null; // receiving chain key (base64)
  Ns: number;  // message number we have sent in current sending chain
  Nr: number;  // message number we have received in current receiving chain
  PN: number;  // previous sending chain length (used when ratchet occurs)
  MKSKIPPED: { [key: string]: string }; // map "<dhpub_b64>|<n>" -> messageKey_b64
}

/**
 * Helpers: base64 <-> Uint8Array
 */
function toB64(u8: Uint8) {
  return sodium.to_base64(u8, sodium.base64_variants.ORIGINAL);
}
function fromB64(b: string) {
  return sodium.from_base64(b, sodium.base64_variants.ORIGINAL);
}

function u8Concat(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, a) => sum + a.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for(const a of arrays){
        result.set(a, offset)
        offset += a.length
    }
    return result
}

/**
 * HKDF-like root key KDF: derive new RK and a chain key from RK and a DH output.
 * We'll do: seed = HK(RK || DH) then split into root(32) | chain(32)
 */
function KDF_RK(RK_u8: Uint8, dh_u8: Uint8) {
  const seed = sodium.crypto_generichash(32, sodium.crypto_generichash(32, u8Concat(RK_u8, dh_u8)));
  // further derive 64 bytes and split
  const out = sodium.crypto_generichash(64, seed);
  const newRK = out.slice(0, 32);
  const CK = out.slice(32, 64);
  return { newRK, CK };
}

/**
 * Symmetric chain KDF: derive next chain key and message key from a chain key.
 * We return nextChainKey (32) and messageKey (32).
 */
function KDF_Chain(chainKey_u8: Uint8) {
  const mk = sodium.crypto_generichash(32, sodium.crypto_generichash(32, u8Concat(chainKey_u8, new Uint8Array([0x01]))));
  const nextCK = sodium.crypto_generichash(32, sodium.crypto_generichash(32, u8Concat(chainKey_u8, new Uint8Array([0x02]))));
  return { nextCK, mk };
}

/**
 * Compose map key for MKSKIPPED
 */
function mkSkippedKey(dhPub_b64: string, n: number) {
  return `${dhPub_b64}|${n}`;
}

/**
 * Save / load session state to IndexedDB (idb-keyval).
 * sessionId should be unique per peer (e.g. `${peerUserId}:${peerDeviceId}`)
 */
export async function saveSession(sessionId: string, state: RatchetState) {
  await idbSet(`ratchet:${sessionId}`, state);
}

export async function loadSession(sessionId: string): Promise<RatchetState | null> {
  const s = await idbGet(`ratchet:${sessionId}`);
  return s || null;
}

/**
 * Initialize a session state using a rootKey (from X3DH) and a DH keypair for us.
 * - rootKey_b64: base64 root key derived from X3DH
 * - ourDH: optional existing DH keypair { pub_b64, priv_b64 } - if not provided a new one is generated
 * - theirPub_b64: if present, immediately performs a DH ratchet to derive CKs/CKr
 */
export async function initSession(rootKey_b64: string, ourDH?: { pub_b64: string; priv_b64: string }, theirPub_b64?: string): Promise<RatchetState> {
  await sodium.ready;
  const RK_u8 = fromB64(rootKey_b64);

  let DHs = ourDH;
  if (!DHs) {
    const kp = sodium.crypto_kx_keypair();
    DHs = {
      pub_b64: toB64(kp.publicKey),
      priv_b64: toB64(kp.privateKey),
    };
  }

  const state: RatchetState = {
    RK_b64: rootKey_b64,
    DHs,
    DHr_b64: null,
    CKs_b64: null,
    CKr_b64: null,
    Ns: 0,
    Nr: 0,
    PN: 0,
    MKSKIPPED: {},
  };

  // If we already have their public, perform an initial DH ratchet so chains are ready
  if (theirPub_b64) {
    // perform DH between our priv and their pub -> derive new RK and CK (for sending)
    const dhOut = sodium.crypto_scalarmult(fromB64(DHs.priv_b64), fromB64(theirPub_b64));
    const { newRK, CK } = KDF_RK(RK_u8, dhOut);
    state.RK_b64 = toB64(newRK);
    state.CKs_b64 = toB64(CK);
    state.CKr_b64 = null; // haven't derived receiving chain yet until we receive a ratchet from them
    state.DHr_b64 = theirPub_b64;
  }

  return state;
}

/**
 * INTERNAL: Perform a DH ratchet when we learn a new remote DH public key (i.e. header.dhPub != DHr)
 * This implements the sequence:
 *   PN = Ns
 *   Ns = 0; Nr = 0
 *   DHr = header.dhPub
 *   DHs = generate new DH keypair
 *   DHs_priv XOR DHr -> KDF_RK -> RK, CKs
 *   DHs_priv XOR DHr? We perform two DHs as in reference: we do DH between old DHs and header? (simplified)
 *
 * Implementation note:
 *   We'll follow the standard approach:
 *     1) DH = DHs.priv * DHr.pub -> derive RK & CKr
 *     2) rotate DHs (generate new keypair)
 *     3) DH2 = DHs.priv * DHr.pub -> derive RK & CKs
 *
 * The above ensures both sides compute same RK & CK pairs.
 */
async function dhRatchetOnReceive(state: RatchetState, theirDhPub_b64: string) {
  await sodium.ready;
  const RK_u8 = fromB64(state.RK_b64);
  // set PN and reset counters
  state.PN = state.Ns;
  state.Ns = 0;
  state.Nr = 0;

  // Update DHr
  state.DHr_b64 = theirDhPub_b64;

  // 1) dhOut = DHs.priv * DHr.pub  (old DHs)
  const dhOut1 = sodium.crypto_scalarmult(fromB64(state.DHs.priv_b64), fromB64(theirDhPub_b64));
  const { newRK: rk1, CK: CKr } = KDF_RK(RK_u8, dhOut1);

  // 2) rotate DHs (generate new DH keypair for our side)
  const newKP = sodium.crypto_kx_keypair();
  const newDHs = { pub_b64: toB64(newKP.publicKey), priv_b64: toB64(newKP.privateKey) };
  state.DHs = newDHs;

  // 3) dhOut2 = newDHs.priv * DHr.pub
  const dhOut2 = sodium.crypto_scalarmult(fromB64(newDHs.priv_b64), fromB64(theirDhPub_b64));
  const { newRK: rk2, CK: CKs } = KDF_RK(rk1, dhOut2);

  // store derived keys
  state.RK_b64 = toB64(rk2);
  state.CKr_b64 = toB64(CKr);
  state.CKs_b64 = toB64(CKs);

  // state.Ns, Nr already reset
}

/**
 * INTERNAL: When sending and a ratchet is required (we choose to ratchet by rotating our DHs)
 * Usually, the sending side rotates DHs after it receives a new DH from remote. But we may rotate proactively.
 * We generate a new DHs & perform DH with DHr to derive new RK + CKs.
 */
async function dhRatchetOnSend(state: RatchetState) {
  await sodium.ready;
  if (!state.DHr_b64) throw new Error("No remote DH available to ratchet against");

  const RK_u8 = fromB64(state.RK_b64);
  // rotate our DHs
  const newKP = sodium.crypto_kx_keypair();
  const newDHs = { pub_b64: toB64(newKP.publicKey), priv_b64: toB64(newKP.privateKey) };
  state.DHs = newDHs;

  // dhOut = newDHs.priv * DHr.pub
  const dhOut = sodium.crypto_scalarmult(fromB64(newDHs.priv_b64), fromB64(state.DHr_b64));
  const { newRK, CK } = KDF_RK(RK_u8, dhOut);

  state.RK_b64 = toB64(newRK);
  state.CKs_b64 = toB64(CK);
  state.PN = state.Ns;
  state.Ns = 0;
}

/**
 * Exported: encrypt a message (runs symmetric ratchet, returns header + ciphertext)
 *
 * Returns:
 *  { header: Header, ciphertext_b64: string, nonce_b64: string }
 */
export async function encryptMessage(state: RatchetState, plaintext: string | Uint8) {
  await sodium.ready;

  // If we don't yet have CKs (sending chain), do a DH ratchet to establish it
  if (!state.CKs_b64) {
    if (!state.DHr_b64) throw new Error("Cannot establish sending chain: missing remote DH public key");
    await dhRatchetOnSend(state);
  }

  // Derive message key from CKs
  const CKs_u8 = fromB64(state.CKs_b64!);
  const { nextCK, mk } = KDF_Chain(CKs_u8);

  // Advance sending chain
  state.CKs_b64 = toB64(nextCK);
  const messageKey = mk; // Uint8Array(32)
  state.Ns += 1;

  // header fields
  const header: Header = {
    dhPub_b64: state.DHs.pub_b64,
    pn: state.PN,
    n: state.Ns - 1, // message index within this sending chain (0-based)
  };

  // AEAD encrypt with messageKey
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const pt_u8 = typeof plaintext === "string" ? sodium.from_string(plaintext) : plaintext;
  const ct = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(pt_u8, null, null, nonce, messageKey);

  return {
    header,
    ciphertext_b64: toB64(ct),
    nonce_b64: toB64(nonce),
  };
}

/**
 * Exported: decrypt a message
 *
 * Accepts header, ciphertext_b64, nonce_b64, returns plaintext string.
 * - stores skipped message keys to MKSKIPPED for out-of-order handling
 */
export async function decryptMessage(state: RatchetState, header: Header, ciphertext_b64: string, nonce_b64: string) {
  await sodium.ready;

  // 1) If header.dhPub differs from our DHr, we must perform a DH ratchet
  if (!state.DHr_b64 || header.dhPub_b64 !== state.DHr_b64) {
    // Save skipped message keys? We'll process after ratchet
    await dhRatchetOnReceive(state, header.dhPub_b64);
  }

  // 2) If the message is in MKSKIPPED (someone earlier computed and stored), use it
  const skippedKey = mkSkippedKey(header.dhPub_b64, header.n);
  if (state.MKSKIPPED[skippedKey]) {
    const mk = fromB64(state.MKSKIPPED[skippedKey]);
    delete state.MKSKIPPED[skippedKey];
    const pt = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, fromB64(ciphertext_b64), null, fromB64(nonce_b64), mk);
    return sodium.to_string(pt);
  }

  // 3) Advance CKr until we reach header.n (if header.n > Nr)
  let CKr_u8 = state.CKr_b64 ? fromB64(state.CKr_b64) : null;
  if (!CKr_u8) throw new Error("No receiving chain key available"); // should not happen if ratchet performed

  while (state.Nr < header.n) {
    const { nextCK, mk } = KDF_Chain(CKr_u8!);
    // store skipped key for message index = state.Nr
    const storeKey = mkSkippedKey(header.dhPub_b64, state.Nr);
    state.MKSKIPPED[storeKey] = toB64(mk);
    CKr_u8 = nextCK;
    state.Nr += 1;
  }

  // Derive key for this message
  const { nextCK: afterCK, mk: messageKey } = KDF_Chain(CKr_u8!);
  // update CKr and Nr
  state.CKr_b64 = toB64(afterCK);
  state.Nr += 1;

  // decrypt
  const pt = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, fromB64(ciphertext_b64), null, fromB64(nonce_b64), messageKey);
  return sodium.to_string(pt);
}
