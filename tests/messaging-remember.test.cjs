const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
test('trusted-browser unlock uses an account/device-scoped non-extractable key and rejects expired or mismatched records',async()=>{
 const records=new Map(),vaults=[];const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 const snapshot={records:{'local:bundle':JSON.stringify({deviceId:'device',signedPreKey:{keyId:1}}),'local:signed-at':String(Date.now()),...Object.fromEntries(Array.from({length:20},(_,i)=>[`prekey:${i}`,'key']))}};
 const mocks={
  'idb-keyval':{get:async name=>structuredClone(records.get(name)),set:async(name,value)=>records.set(name,structuredClone(value)),del:async name=>records.delete(name)},
  '@privacyresearch/libsignal-protocol-typescript':{KeyHelper:{}},
  './vault':{DeviceVault:{open:async()=>{const vault={unlock:stored=>{assert.equal(stored.extractable,false);},atomic:async work=>work(snapshot),close:()=>{},lock:()=>{}};vaults.push(vault);return vault;}}},
  './signal':{DraftSignalStore:class{}},'./attachments':{}
 };
 const old=Object.getOwnPropertyDescriptor(global,'navigator');Object.defineProperty(global,'navigator',{configurable:true,value:{locks:{request:async(name,work)=>work()}}});
 const module={exports:{}};const source=fs.readFileSync('src/lib/signal/deviceManager.ts','utf8').replaceAll('import.meta.url',"'file:///deviceManager.ts'");new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(id=>mocks[id]??require(id),module,module.exports);
 const device=module.exports;
 try{
  records.set('e2-vault:alice',{version:2,deviceId:'device'});
  records.set('e2-trusted:alice',{version:1,deviceId:'device',key,expiresAt:Date.now()+60000});
  assert.equal((await device.restoreRememberedMessaging('alice')).userId,'alice');
  assert.equal(await device.restoreRememberedMessaging('bob'),undefined,'a different account cannot restore this key');
  await assert.rejects(crypto.subtle.exportKey('raw',records.get('e2-trusted:alice').key),/extractable/);
  assert.ok(!JSON.stringify([...records]).includes('passphrase'));
  await device.forgetRememberedMessaging('alice');device.lockMessaging();assert.equal(await device.restoreRememberedMessaging('alice'),undefined);
  for(const changes of [{expiresAt:0},{deviceId:'different'},{version:99}]){
   records.set('e2-trusted:alice',{version:1,deviceId:'device',key,expiresAt:Date.now()+60000,...changes});assert.equal(await device.restoreRememberedMessaging('alice'),undefined);assert.equal(records.has('e2-trusted:alice'),false);
  }
 }finally{device.lockMessaging();if(old)Object.defineProperty(global,'navigator',old);else delete global.navigator;}
});
