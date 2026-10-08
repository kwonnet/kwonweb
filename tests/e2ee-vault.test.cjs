const {test}=require('node:test');const assert=require('node:assert/strict');const {readFileSync}=require('node:fs');const path=require('node:path');const ts=require('typescript');
function load(file){const m={exports:{}};const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',source)(name=>name.startsWith('.')?load(path.join(path.dirname(file),name+'.ts')):require(name),m,m.exports);return m.exports;}
const {DeviceVault}=load('src/lib/signal/vault.ts');
test('encrypted vault isolates accounts, serializes tabs, rolls back failures, and refuses locked/tampered storage',async()=>{
 const databases=new Map(),locks=new Map();const oldNavigator=Object.getOwnPropertyDescriptor(global,'navigator');
 Object.defineProperty(global,'navigator',{configurable:true,value:{locks:{request:(name,fn)=>{const work=(locks.get(name)??Promise.resolve()).then(fn);locks.set(name,work.catch(()=>{}));return work;}}}});
 global.indexedDB={open(name){const req={};queueMicrotask(()=>{let state=databases.get(name);const fresh=!state;if(!state){state={snapshot:undefined,failWrite:false};databases.set(name,state);}req.result={createObjectStore:()=>{},close:()=>{},transaction(){const tx={};tx.objectStore=()=>({get(){const r={result:structuredClone(state.snapshot)};queueMicrotask(()=>tx.oncomplete?.());return r;},put(value){queueMicrotask(()=>{if(state.failWrite){tx.error=new Error('storage aborted');tx.onabort?.();}else{state.snapshot=structuredClone(value);tx.oncomplete?.();}});}});return tx;}};if(fresh)req.onupgradeneeded?.();req.onsuccess?.();});return req;}};
 try{
  const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);const a=await DeviceVault.open('alice','device'),otherTab=await DeviceVault.open('alice','device');a.unlock(key);otherTab.unlock(key);
  await a.atomic(async draft=>{draft.records.secret='secret plaintext';draft.records.count='0';});
  await Promise.all(Array.from({length:10},(_,i)=>(i%2?a:otherTab).atomic(async draft=>{await Promise.resolve();draft.records.count=String(Number(draft.records.count)+1);})));assert.equal(await a.atomic(async d=>d.records.count),'10');
  const state=databases.get('kwonnet-e2ee:alice:device');assert.ok(!new TextDecoder().decode(state.snapshot.ciphertext).includes('secret plaintext'));
  await assert.rejects(a.atomic(async d=>{d.records.count='lost';throw new Error('ratchet validation failed');}));assert.equal(await a.atomic(async d=>d.records.count),'10');
  state.failWrite=true;await assert.rejects(a.atomic(async d=>{d.records.count='lost';}));state.failWrite=false;assert.equal(await a.atomic(async d=>d.records.count),'10');
  let release,start;const started=new Promise(resolve=>start=resolve);const work=a.atomic(async d=>{d.records.count='lost';start();await new Promise(resolve=>release=resolve);});await started;a.lock();release();await assert.rejects(work,/locked/);await assert.rejects(a.atomic(async()=>{}),/Unlock/);a.unlock(key);
  const bob=await DeviceVault.open('bob','device');bob.unlock(key);assert.equal(await bob.atomic(async d=>d.records.secret),undefined);
  state.snapshot.ciphertext=new ArrayBuffer(32);await assert.rejects(a.atomic(async()=>{}));
  const extractable=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);assert.throws(()=>a.unlock(extractable),/Invalid vault key/);a.close();otherTab.close();bob.close();
 }finally{delete global.indexedDB;if(oldNavigator)Object.defineProperty(global,'navigator',oldNavigator);else delete global.navigator;}
});
test('Argon2id worker derives distinct keys without returning passphrases or retaining its input',async()=>{
 const module={exports:{}},posted=[];const self={postMessage:value=>posted.push(value)};const source=ts.transpileModule(readFileSync('src/lib/signal/password.worker.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function('require','module','exports','self',source)(require,module,module.exports,self);
 await self.onmessage({data:{passphrase:'correct horse battery staple',salt:new Uint8Array(16)}});await self.onmessage({data:{passphrase:'another long passphrase',salt:new Uint8Array(16)}});assert.equal(posted[0].key.length,32);assert.notDeepEqual(posted[0].key,posted[1].key);assert.ok(!JSON.stringify(posted).includes('passphrase'));
});
