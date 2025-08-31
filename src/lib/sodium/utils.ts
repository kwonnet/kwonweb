import { loadSession, saveSession, encryptMessage } from './doubleRatchet';
import { makeSessionId } from './sessionUtils';

export async function sendMessageToUser({ 
    localUserId, 
    localDeviceId, 
    recipientUserId, 
    recipientBundles,
    plaintext }: {
    localUserId: string;
    localDeviceId: string;
    recipientUserId: string;
    recipientBundles: any;
    plaintext: string;
}, socket: any) {
  for (const bundle of recipientBundles) {
    const sessionId = makeSessionId(localUserId, localDeviceId, recipientUserId, bundle.deviceId);
    let state = await loadSession(sessionId);
    if (!state) {
      // bootstrap: call initiateX3DH and save session (see earlier)
      // For brevity assume session exists
      throw new Error('session missing');
    }
    const { header, ciphertext_b64, nonce_b64 } = await encryptMessage(state, plaintext);
    await saveSession(sessionId, state);
    // send envelope targeted
    socket.emit('message:send', {
      conversationId: null,
      envelopes: [{
        toUserId: recipientUserId,
        toDeviceId: bundle.deviceId,
        type: 'message',
        header,
        ciphertext_b64,
        nonce_b64,
        fromUserId: localUserId,
        fromDeviceId: localDeviceId
      }]
    });
  }
}

// socket.on('message:new', async (env) => {
//   if (env.type === 'init') {
//     // perform responder X3DH to compute rootKey
//     const { rootKey_b64 } = await respondX3DH(localDeviceId, env.initPacket);
//     const state = await initRatchet(rootKey_b64, undefined, env.initPacket.ephPub);
//     const sessionId = makeSessionId(env.toUserId, env.toDeviceId, env.fromUserId, env.fromDeviceId);
//     await saveSession(sessionId, state);
//     return;
//   }
//   if (env.type === 'message') {
//     const sessionId = makeSessionId(localUserId, localDeviceId, env.fromUserId, env.fromDeviceId);
//     const state = await loadSession(sessionId);
//     if (!state) {
//       console.warn('no session for message'); return;
//     }
//     const plaintext = await decryptMessage(state, env.header, env.ciphertext_b64, env.nonce_b64);
//     await saveSession(sessionId, state);
//     // persist message locally / display
//   }
// });

