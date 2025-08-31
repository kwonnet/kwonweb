import sodium from "libsodium-wrappers-sumo";
import { set as idbSet, get as idbGet } from "idb-keyval";

export async function ready() {
  await sodium.ready;
  return sodium;
}

function toB64(u8: Uint8Array) {
  return sodium.to_base64(u8, sodium.base64_variants.ORIGINAL);
}

function fromB64(b: string) {
  return sodium.from_base64(b, sodium.base64_variants.ORIGINAL);
}

export async function generateDeviceBundle(
  deviceId: string,
  oneTimeCount = 20
) {
  try {
    await ready();
    const idKP = sodium.crypto_sign_keypair();
    const identityPubX25519 = sodium.crypto_sign_ed25519_pk_to_curve25519(
      idKP.publicKey
    );
    const identityPrivX25519 = sodium.crypto_sign_ed25519_sk_to_curve25519(
      idKP.privateKey
    );
    const spk = sodium.crypto_kx_keypair();
    const spkSig = sodium.crypto_sign_detached(spk.publicKey, idKP.privateKey);
    const oneTime = [];
    for (let i = 0; i < oneTimeCount; i++) {
      const kp = sodium.crypto_kx_keypair();
      oneTime.push({
        keyId: i + 1,
        pubX25519: toB64(kp.publicKey),
        privX25519: toB64(kp.privateKey),
      });
    }
    const storeKey = `device:${deviceId}:priv`;

    return {
      privateBundle: {
        identity: {
          publicKey: toB64(idKP.publicKey),
          privateKey: toB64(idKP.privateKey),
        },
        identityX25519: {
          pub: toB64(identityPubX25519),
          priv: toB64(identityPrivX25519),
        },
        signedPreKeyPriv: toB64(spk.privateKey),
        oneTimePrivKeys: oneTime.map((o) => ({
          keyId: o.keyId,
          privX25519: o.privX25519,
        })),
      },
      publicBundle: {
        deviceId,
        identityPubEd25519: toB64(idKP.publicKey),
        identityPubX25519: toB64(identityPubX25519),
        signedPreKeyPubX25519: toB64(spk.publicKey),
        signedPreKeySignature: toB64(spkSig),
        oneTimePreKeys: oneTime.map((o) => ({
          keyId: o.keyId,
          pubX25519: o.pubX25519,
        })),
      },
      storeKey,
    };
  } catch (error) {
    throw error;
  }
}

export async function loadDevicePrivate(deviceId: string) {
  return await idbGet(`device:${deviceId}:priv`);
}

export async function checkDeviceExists(deviceId: string) {
  return await idbGet(`device:${deviceId}:priv`);
}
