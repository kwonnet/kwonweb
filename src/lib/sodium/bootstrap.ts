import { initiateX3DH } from './x3dh';
import { initSession as initRatchet, saveSession as saveRatchet } from './doubleRatchet';
import { makeSessionId } from './sessionUtils';
import sodium from 'libsodium-wrappers-sumo';

export async function bootstrapSessionsToRecipient({ localUserId, localDeviceId, recipientUserId, recipientBundles }: {
    localUserId: string;
    localDeviceId: string;
    recipientUserId: string;
    recipientBundles: any;
}, sockeIo: any) {

  await sodium.ready;
//   const socket = io(socketUrl, { auth: { token: authToken, deviceId: localDeviceId } });
  const established: string[] = [];

  for (const bundle of recipientBundles) {
    const { rootKey_b64, initPacket } = await initiateX3DH(localDeviceId, bundle);
    // seed ratchet with rootKey; include their eph pub as remote DH to prepare CKs
    const state = await initRatchet(rootKey_b64, undefined, initPacket.ephPub);
    const sessionId = makeSessionId(localUserId, localDeviceId, recipientUserId, bundle.deviceId);
    await saveRatchet(sessionId, state);
    // send initPacket targeted to device
    sockeIo.emit('message:send', {
      conversationId: null,
      envelopes: [{
        toUserId: recipientUserId,
        toDeviceId: bundle.deviceId,
        type: 'init',
        initPacket,
        fromUserId: localUserId,
        fromDeviceId: localDeviceId
      }]
    });
    established.push(bundle.deviceId);
  }
  return established;
}
