const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const ts=require('typescript');
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;new Function('require','module','exports',source)(name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),module,module.exports);cache.set(file,module.exports);return module.exports;}
const {DraftSignalStore,encryptBatch,decryptAndCommit}=load('src/lib/signal/signal.ts');
const {base64}=load('src/lib/signal/attachments.ts');
const {KeyHelper}=require('@privacyresearch/libsignal-protocol-typescript');
function vault(){let state={version:1,records:{},outbox:{},inbox:{}};let queue=Promise.resolve();return {atomic(work){const run=queue.then(async()=>{const draft=structuredClone(state);const value=await work(draft);state=draft;return value;});queue=run.catch(()=>{});return run;},snapshot:()=>state};}
async function enroll(v){return v.atomic(async draft=>{const store=new DraftSignalStore(draft),identity=await KeyHelper.generateIdentityKeyPair(),registrationId=KeyHelper.generateRegistrationId();store.initialize(identity,registrationId);const signed=await KeyHelper.generateSignedPreKey(identity,1),pre=await KeyHelper.generatePreKey(1);await store.storeSignedPreKey(1,signed.keyPair);await store.storePreKey(1,pre.keyPair);return {registrationId,identityKey:identity.pubKey,signedPreKey:{keyId:1,publicKey:signed.keyPair.pubKey,signature:signed.signature},preKey:{keyId:1,publicKey:pre.keyPair.pubKey}};});}
test('Signal prekey exchange, replies, out-of-order delivery, exact retries and transactional replay cache',async()=>{
 const a=vault(),b=vault();const ab=await enroll(a),bb=await enroll(b);const conversationId='room-1';
 const target={userId:'bob',deviceId:'bob-phone',signalDeviceId:1,conversationId,bundle:bb};const sender={userId:'alice',deviceId:'alice-phone',signalDeviceId:1,conversationId,identityPublic:base64(new Uint8Array(ab.identityKey)),bundle:ab};
 const first={eventId:'first',conversationId,text:'private hello'};const envelopes=await encryptBatch(a,first,[target]);
 const before=structuredClone(a.snapshot());assert.deepEqual(await encryptBatch(a,first,[target]),envelopes);assert.deepEqual(a.snapshot(),before);
 const received=await decryptAndCommit(b,'server-1',sender,envelopes[0],v=>v);assert.equal(received.text,'private hello');
 const bstate=structuredClone(b.snapshot());assert.deepEqual(await decryptAndCommit(b,'server-1',sender,envelopes[0],v=>v),received);assert.deepEqual(b.snapshot(),bstate);await assert.rejects(decryptAndCommit(b,'server-1',sender,envelopes[0],()=>{throw new Error('Cached context mismatch');}));assert.deepEqual(b.snapshot(),bstate);
 assert.equal(b.snapshot().records['prekey:1'],undefined);
 const response=await encryptBatch(b,{eventId:'reply',conversationId,text:'hello back'},[sender]);assert.equal((await decryptAndCommit(a,'server-2',target,response[0],v=>v)).text,'hello back');
 const second=await encryptBatch(a,{eventId:'second',conversationId,text:'second'},[target]),third=await encryptBatch(a,{eventId:'third',conversationId,text:'third'},[target]);
 assert.equal((await decryptAndCommit(b,'server-3',sender,third[0],v=>v)).text,'third');assert.equal((await decryptAndCommit(b,'server-4',sender,second[0],v=>v)).text,'second');
});
test('invalid content, tampered ciphertext and peer identity replacement do not advance receiver storage',async()=>{
 const a=vault(),b=vault(),evil=vault();await enroll(a);const bb=await enroll(b);await enroll(evil);const conversationId='room';
 const target={userId:'bob',deviceId:'phone',signalDeviceId:1,conversationId,bundle:bb},sender={userId:'alice',deviceId:'phone',signalDeviceId:1,conversationId};
 const wire=(await encryptBatch(a,{eventId:'one',conversationId},[target]))[0];const before=structuredClone(b.snapshot());
 await assert.rejects(decryptAndCommit(b,'id',sender,wire,()=>{throw new Error('Invalid content');}));assert.deepEqual(b.snapshot(),before);
 const tampered={...wire,ciphertextB64:wire.ciphertextB64.slice(0,-8)+'AAAAAAAA'};await assert.rejects(decryptAndCommit(b,'id',sender,tampered,v=>v));assert.deepEqual(b.snapshot(),before);
 await decryptAndCommit(b,'id',sender,wire,v=>v);
 const evilWire=(await encryptBatch(evil,{eventId:'bad',conversationId},[target]))[0];const trusted=structuredClone(b.snapshot());await assert.rejects(decryptAndCommit(b,'bad-id',sender,evilWire,v=>v));assert.deepEqual(b.snapshot(),trusted);
});
test('device pins reject key replacement',async()=>{
 const v=vault();await enroll(v);const other=await KeyHelper.generateIdentityKeyPair();await v.atomic(async d=>{const s=new DraftSignalStore(d);assert.equal(await s.isTrustedIdentity('bob:uuid.1',other.pubKey,1),true);await s.saveIdentity('bob:uuid.1',other.pubKey);assert.equal(await s.isTrustedIdentity('bob:uuid',other.pubKey,1),true);const changed=await KeyHelper.generateIdentityKeyPair();assert.equal(await s.isTrustedIdentity('bob:uuid',changed.pubKey,1),false);await assert.rejects(s.saveIdentity('bob:uuid.1',changed.pubKey));});
});

test('first-contact sender identity must match authenticated device enrollment',async()=>{
 const alice=vault(),bob=vault(),impostor=vault();const ab=await enroll(alice),bb=await enroll(bob);await enroll(impostor);const conversationId='first-contact';
 const target={userId:'bob',deviceId:'bob-device',signalDeviceId:1,conversationId,bundle:bb};
 const forged=(await encryptBatch(impostor,{eventId:'forged',conversationId},[target]))[0];
 const before=structuredClone(bob.snapshot());await assert.rejects(decryptAndCommit(bob,'forged-id',{userId:'alice',deviceId:'alice-device',signalDeviceId:1,conversationId,identityPublic:base64(new Uint8Array(ab.identityKey))},forged,v=>v));assert.deepEqual(bob.snapshot(),before);
});
