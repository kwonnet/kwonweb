const {test} = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const cache = new Map(); let runtime, derivations = 0;
const mocks = {'@/config': {apiUrl:'https://relay.invalid'}, '@/lib/signal/deviceManager': {
  currentMessagingRuntime: userId => {if (!runtime || runtime.userId !== userId) throw new Error('Unlock encrypted messaging'); return runtime;},
  messagingPassphraseKey: async (passphrase,salt) => {
    if (passphrase.length < 12) throw new Error('Use a longer passphrase');
    const sodium = require('libsodium-wrappers-sumo'); await sodium.ready; derivations++;
    const raw = sodium.crypto_pwhash(32,passphrase,salt,3,64*1024*1024,sodium.crypto_pwhash_ALG_ARGON2ID13);
    const key = await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']); raw.fill(0); return key;
  },
}};
mocks['./deviceManager'] = mocks['@/lib/signal/deviceManager'];
function load(file) {
 file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(name=>name in mocks?mocks[name]:name.startsWith('@/')?load('src/'+name.slice(2)+'.ts'):name.startsWith('.')?load(path.join(path.dirname(file),name+'.ts')):require(name),module,module.exports);cache.set(file,module.exports);return module.exports;
}
const history = load('src/lib/signal/history.ts'), {localConversation} = load('src/lib/conversations/messaging.ts');
const {eventSchema,deleteSigningBytes} = load('src/lib/signal/contracts.ts');
const {base64,unbase64} = load('src/lib/signal/attachments.ts');
const transferPassphrase='history-transfer-secret-phrase';
function device(userId,records={}) {
 const draft={version:1,records,outbox:{},inbox:{}};
 const r={userId,deviceId:crypto.randomUUID(),draft,vault:{atomic:async work=>{const copy=structuredClone(draft);const result=await work(copy);Object.assign(draft,copy);return result;}}};return r;
}
test('encrypted history transfer preserves actions and media keys without cloning device keys or ratchet state',async()=>{
 const source=device('alice');runtime=source;
 const room=crypto.randomUUID(), bobDevice=crypto.randomUUID();
 const signing=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
 const publicKey=base64(new Uint8Array(await crypto.subtle.exportKey('raw',signing.publicKey)));
 let sequence=0;
 function store(content) {
  const event=eventSchema.parse({v:2,eventId:crypto.randomUUID(),conversationId:room,senderId:'bob',senderDeviceId:bobDevice,createdAt:new Date().toISOString(),content});
  const id=crypto.randomUUID();const wire={id,eventId:event.eventId,conversation:room,fromUserId:'bob',fromDeviceId:bobDevice,senderSignalDeviceId:42,senderActionSigningPublic:publicKey,senderIdentityPublic:base64(new Uint8Array(33).fill(5)),toUserId:'alice',toDeviceId:source.deviceId,serverSequence:String(++sequence),createdAt:event.createdAt,wireType:3,ciphertextB64:'original-ciphertext',seen:[],read:[]};
  source.draft.records[`wire:${id}`]=JSON.stringify(wire);source.draft.records[`event:${event.eventId}`]=JSON.stringify(event);return {event,wire};
 }
 const original=store({kind:'text',text:'private first message'});
 const target={targetId:original.event.eventId,targetHash:base64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(original.event)))))};
 store({kind:'edit',...target,text:'edited history',revision:1});store({kind:'reaction',...target,emoji:'❤️',remove:false});
 const media=store({kind:'media',text:'photo',reply:target,attachments:[{v:1,blobId:crypto.randomUUID(),keyB64:base64(new Uint8Array(32).fill(7)),ivB64:base64(new Uint8Array(12).fill(8)),ciphertextSha256B64:base64(new Uint8Array(32)),ciphertextBytes:16,plaintextBytes:0,mime:'image/png',filename:'photo.png'}]});
 const hidden=store({kind:'text',text:'hidden history'});source.draft.records[`hidden:${room}`]=JSON.stringify([hidden.wire.id]);
 const deleted=store({kind:'text',text:'deleted history'});
 const deletedHash=base64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(deleted.event)))));
 const deletion=store({kind:'delete',targetId:deleted.event.eventId,targetHash:deletedHash,signature:''});
 deletion.event.content.signature=base64(new Uint8Array(await crypto.subtle.sign('Ed25519',signing.privateKey,deleteSigningBytes(deletion.event,deleted.event.eventId,deletedHash))));
 source.draft.records[`event:${deletion.event.eventId}`]=JSON.stringify(deletion.event);
 source.draft.records['local:action-private']='DO-NOT-EXPORT-PRIVATE-KEY';source.draft.records['session:old']='DO-NOT-EXPORT-RATCHET';source.draft.outbox['queued']='DO-NOT-EXPORT-OUTBOX';source.draft.records[`cursor:${room}`]='999';
 const archive=await history.exportMessagingHistory('alice',transferPassphrase);const serialized=await archive.text();
 assert.doesNotMatch(serialized,/private first|edited history|photo.png|DO-NOT-EXPORT|secret-phrase/);
 const targetDevice=device('alice',{'local:action-private':'NEW-PRIVATE-KEY','session:new':'NEW-RATCHET'});runtime=targetDevice;
 const result=await history.importMessagingHistory('alice',archive,transferPassphrase);assert.equal(result.restored,7);assert.equal(result.conversations,1);
 assert.equal(targetDevice.draft.records['local:action-private'],'NEW-PRIVATE-KEY');assert.equal(targetDevice.draft.records['session:new'],'NEW-RATCHET');assert.equal(targetDevice.draft.records['session:old'],undefined);assert.equal(targetDevice.draft.records[`cursor:${room}`],undefined);assert.deepEqual(targetDevice.draft.outbox,{});assert.deepEqual(targetDevice.draft.inbox,{});
 const projected=await localConversation('alice',room,'bob');assert.equal(projected.length,3);
 assert.equal(projected[0].content,'edited history');assert.deepEqual(projected[0].reactions,[{userId:'bob',reaction:'❤️'}]);
 assert.deepEqual(projected[1].attachments,media.event.content.attachments);assert.deepEqual(projected[1].reply,target);assert.equal(projected[2].deleted,true);
 const restoredWire=JSON.parse(targetDevice.draft.records[`wire:${original.wire.id}`]);assert.equal(restoredWire.toDeviceId,targetDevice.deviceId);assert.equal(restoredWire.ciphertextB64,'');
 restoredWire.read=[{userId:'alice',readAt:new Date().toISOString()}];targetDevice.draft.records[`wire:${original.wire.id}`]=JSON.stringify(restoredWire);
 assert.equal((await history.importMessagingHistory('alice',archive,transferPassphrase)).restored,0);assert.deepEqual(JSON.parse(targetDevice.draft.records[`wire:${original.wire.id}`]).read,restoredWire.read);
 const before=structuredClone(targetDevice.draft);
 await assert.rejects(history.importMessagingHistory('alice',archive,'a wrong transfer passphrase'),/Incorrect transfer passphrase/);assert.deepEqual(targetDevice.draft,before);
 const damaged=JSON.parse(serialized);damaged.ciphertext=(damaged.ciphertext[0]==='A'?'B':'A')+damaged.ciphertext.slice(1);
 await assert.rejects(history.importMessagingHistory('alice',new Blob([JSON.stringify(damaged)]),transferPassphrase),/damaged history/);assert.deepEqual(targetDevice.draft,before);
 runtime=device('mallory');await assert.rejects(history.importMessagingHistory('mallory',archive,transferPassphrase),/different account/);assert.deepEqual(runtime.draft.records,{});
 runtime=targetDevice;targetDevice.draft.records[`event:${original.event.eventId}`]=JSON.stringify({...original.event,content:{kind:'text',text:'conflicting'}});
 const conflicted=structuredClone(targetDevice.draft);await assert.rejects(history.importMessagingHistory('alice',archive,transferPassphrase),/conflicts/);assert.deepEqual(targetDevice.draft,conflicted);
 assert.ok(derivations>=6);
});
test('history rejects malformed files, unknown fields and excessive file sizes before expensive key derivation',async()=>{
 runtime=device('alice');const count=derivations;
 await assert.rejects(history.importMessagingHistory('alice',new Blob(['bad json']),transferPassphrase));
 await assert.rejects(history.importMessagingHistory('alice',new Blob([JSON.stringify({format:'kwonnet-history',version:99})]),transferPassphrase));
 await assert.rejects(history.importMessagingHistory('alice',{size:history.MAX_HISTORY_FILE_BYTES+1},transferPassphrase),/too large/);
 assert.equal(derivations,count);
});
test('accepted outbox messages stay visible until relay ciphertext replaces them, without duplication',async()=>{
 const source=device('alice');runtime=source;
 const room=crypto.randomUUID(),eventId=crypto.randomUUID();
 const event={v:2,eventId,conversationId:room,senderId:'alice',senderDeviceId:source.deviceId,createdAt:new Date().toISOString(),content:{kind:'text',text:'Keep this bubble'}};
 source.draft.records[`event:${eventId}`]=JSON.stringify(event);source.draft.outbox[eventId]='[]';
 const messaging=load('src/lib/conversations/messaging.ts'),original=global.fetch;
 const wireId=crypto.randomUUID();global.fetch=async()=>({ok:true,json:async()=>({messageId:wireId})});
 try{
  assert.equal((await localConversation('alice',room,'bob'))[0].queued,true);
  await messaging.flushMessagingOutbox('alice','token');assert.deepEqual(source.draft.outbox,{});
  const sent=await localConversation('alice',room,'bob');assert.equal(sent.length,1);assert.equal(sent[0].content,'Keep this bubble');assert.equal(sent[0].sendingState,'sent');assert.equal(sent[0].eventId,eventId);
  const wire={id:wireId,eventId,conversation:room,fromUserId:'alice',fromDeviceId:source.deviceId,senderSignalDeviceId:1,senderActionSigningPublic:'',senderIdentityPublic:'',toUserId:'alice',toDeviceId:source.deviceId,serverSequence:'1',createdAt:event.createdAt,wireType:1,ciphertextB64:'',seen:[],read:[],ownDevice:true};
  await messaging.decryptWire('alice',wire);assert.equal(source.draft.records[`sent:${eventId}`],undefined);
  const confirmed=await localConversation('alice',room,'bob');assert.equal(confirmed.length,1);assert.equal(confirmed[0].id,wireId);assert.equal(confirmed[0].eventId,eventId);
 }finally{global.fetch=original;}
});
