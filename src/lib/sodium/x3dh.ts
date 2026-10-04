import sodium from 'libsodium-wrappers-sumo';
import { loadDevicePrivate } from './crypto';


function toB64(u: Uint8Array){ return sodium.to_base64(u, sodium.base64_variants.ORIGINAL); }

function fromB64(s: string){ return sodium.from_base64(s, sodium.base64_variants.ORIGINAL); }

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

export async function initiateX3DH(localDeviceId: string, theirBundle: any) {
  try {
    await sodium.ready;
  
  const priv = await loadDevicePrivate(localDeviceId);
  
  if (!priv) throw new Error('no local device private keys');

  const eph = sodium.crypto_kx_keypair();
  const ephPriv = eph.privateKey;
  const ephPub_b64 = toB64(eph.publicKey);

  const dh1 = sodium.crypto_scalarmult(ephPriv, fromB64(theirBundle.identityPubX25519));
  const dh2 = sodium.crypto_scalarmult(fromB64(priv.identityX25519.priv), fromB64(theirBundle.signedPreKeyPubX25519));
  const dh3 = sodium.crypto_scalarmult(ephPriv, fromB64(theirBundle.signedPreKeyPubX25519));
  let concat = u8Concat(dh1, dh2, dh3)
  if (theirBundle.oneTimePreKey) {
    const dh4 = sodium.crypto_scalarmult(ephPriv, fromB64(theirBundle.oneTimePreKey.pubX25519));
    concat = u8Concat(dh1, dh2, dh3, dh4)
  }
  const combined = sodium.crypto_generichash(32, sodium.crypto_generichash(32, concat, null), null);
  const rootKey = sodium.to_base64(sodium.crypto_generichash(32, combined, null), sodium.base64_variants.ORIGINAL);

  return { rootKey_b64: rootKey, initPacket: { ephPub: ephPub_b64 }, ephemeralPriv_b64: toB64(ephPriv) };
  } catch (error) {
    throw error
  }
}

export async function respondX3DH(localDeviceId: string, initPacket: any, theirBundle?: any) {
  try {
    await sodium.ready;
  const priv = await loadDevicePrivate(localDeviceId);
  if (!priv) throw new Error('no local device private keys');
  const ephPub = fromB64(initPacket.ephPub);

  const dh1 = sodium.crypto_scalarmult(fromB64(priv.signedPreKeyPriv), ephPub);
  const dh2 = sodium.crypto_scalarmult(fromB64(priv.identityX25519.priv), ephPub);
  // if oneTime priv exists, include it
  // Note: exact mapping depends on how you built DH combos above; ensure both sides use same combos
  const combined = sodium.crypto_generichash(32, sodium.crypto_generichash(32, u8Concat(dh1, dh2), null), null);
  const rootKey = sodium.to_base64(sodium.crypto_generichash(32, combined, null), sodium.base64_variants.ORIGINAL);
  return { rootKey_b64: rootKey };
  } catch (error) {
    throw error
  }
}
