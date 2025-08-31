import sodium from "libsodium-wrappers-sumo";
import { initiateX3DH, respondX3DH } from "./x3dh";
import {
  initSession,
  loadSession,
  saveSession,
  encryptMessage,
  decryptMessage,
} from "./doubleRatchet";
import { makeSessionId } from "./sessionUtils";
import { Socket } from "socket.io-client";
import { ChatDevice, DeviceBundle, MessageEnvelope, SessionEvelope } from "@/types/sodium";

export async function bootstrapPerDeviceSessions(
  localUserId: string,
  localDeviceId: string,
  recipientUserId: string,
  bundles: ChatDevice[],
  socket: Socket
) {
  await sodium.ready;

  for (const b of bundles) {
    // Skip if we already have a session
    const sid = makeSessionId(
      localUserId,
      localDeviceId,
      recipientUserId,
      b.deviceId
    );
    const exist = await loadSession(sid);
    if (exist) continue;

    const { rootKey_b64, initPacket } = await initiateX3DH(localDeviceId, b);
    const st = await initSession(rootKey_b64, undefined, initPacket.ephPub);
    await saveSession(sid, st);

    socket.emit("session:init", {
      conversationId: null,
      envelopes: [
        {
          toUserId: recipientUserId,
          toDeviceId: b.deviceId,
          initPacket,
          fromUserId: localUserId,
          fromDeviceId: localDeviceId,
        },
      ],
    });
  }
}

export async function initiateSession({
  localDeviceId,
  body,
}: {
  localDeviceId: string;
  body: SessionEvelope;
}): Promise<string | null> {
  await sodium.ready;
  // Create responder session
  const { rootKey_b64 } = await respondX3DH(localDeviceId, body.initPacket);
  const st = await initSession(rootKey_b64, undefined, body.initPacket.ephPub);
  const sid = makeSessionId(
    body.toUserId,
    body.toDeviceId,
    body.fromUserId,
    body.fromDeviceId
  );
  await saveSession(sid, st);
  return null;
}

export async function decryptIncomingMessage({
  body,
  localDeviceId,
  localUserId,
}: {
  localUserId: string;
  localDeviceId: string;
  body: MessageEnvelope;
}): Promise<string | null> {

  await sodium.ready;

  const sid = makeSessionId(
    localUserId,
    localDeviceId,
    body.fromUserId,
    body.fromDeviceId
  );
  const st = await loadSession(sid);
  if (!st) return null; // (optional) queue until bootstrap finishes

  const plaintext = await decryptMessage(
    st,
    body.header,
    body.ciphertext,
    body.nonce
  );
  await saveSession(sid, st);
  return plaintext;
}

export async function encryptForAllDevices(
  localUserId: string,
  localDeviceId: string,
  recipientUserId: string,
  recipientBundles: DeviceBundle[],
  plaintext: string
) {
  const envelopes = [];
  for (const b of recipientBundles) {
    const sid = makeSessionId(
      localUserId,
      localDeviceId,
      recipientUserId,
      b.deviceId
    );
    const st = await loadSession(sid);
    if (!st) throw new Error(`Missing session for device ${b.deviceId}`);
    const { header, ciphertext_b64, nonce_b64 } = await encryptMessage(
      st,
      plaintext
    );
    await saveSession(sid, st);
    envelopes.push({
      toUserId: recipientUserId,
      toDeviceId: b.deviceId,
      fromUserId: localUserId,
      fromDeviceId: localDeviceId,
      ciphertext: ciphertext_b64,
      nonce: nonce_b64,
      header
    });
  }
  return envelopes;
}
