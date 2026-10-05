const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const {webcrypto}=require('node:crypto');
function load(file,mocks={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;new Function('require','module','exports',code)(id=>id in mocks?mocks[id]:require(id),module,module.exports);return module.exports;}
test('uncertain task rewards reuse their intent key and confirmed outcomes clear it',async()=>{
 const prior={window:global.window,fetch:global.fetch,crypto:global.crypto};const data=new Map();global.window={sessionStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};global.crypto=webcrypto;
 const api=load('src/lib/tasks/index.ts',{'@/config':{apiUrl:'https://api.test/api/v1'},'@/config/axios':{axiosAPI:{}},'@/utils/wallet-intents':load('src/utils/wallet-intents.ts')});const keys=[];
 try{global.fetch=async(url,options)=>{keys.push(options.headers['Idempotency-Key']);assert.equal(url,'https://api.test/api/v1/tasks/engagement/like/claim');assert.equal(options.headers.Authorization,'Bearer token');throw Error('network uncertain');};
  await assert.rejects(api.checkEngagementTask('like','owner','token'));await assert.rejects(api.checkEngagementTask('like','owner','token'));assert.equal(keys[0],keys[1]);assert.equal(data.size,1);
  global.fetch=async(url,options)=>{assert.equal(options.headers['Idempotency-Key'],keys[0]);return new Response(JSON.stringify({reward:10,message:'Earned 10'}));};
  assert.equal((await api.checkEngagementTask('like','owner','token')).reward,10);assert.equal(data.size,0);
  global.fetch=async()=>new Response(JSON.stringify({error:'Progress: 1/20'}),{status:422});await assert.rejects(api.checkEngagementTask('like','owner','token'),/Progress: 1\/20/);assert.equal(data.size,0);
 }finally{global.window=prior.window;global.fetch=prior.fetch;global.crypto=prior.crypto;}
});
test('viewport tracking waits for actual visible dwell and never puts tokens in URLs',async()=>{
 const prior={document:global.document,fetch:global.fetch,setTimeout:global.setTimeout,clearTimeout:global.clearTimeout};let effect,timer,cleanup;const calls=[];
 global.document={visibilityState:'visible'};global.setTimeout=fn=>{timer=fn;return 1;};global.clearTimeout=()=>{timer=null;};global.fetch=async(...args)=>{calls.push(args);return new Response('{}');};
 let viewed=true;
 const api=load('src/hooks/useTrackImpression.tsx',{react:{useEffect:fn=>{effect=fn;}},'react-intersection-observer':{useInView:options=>{assert.equal(options.threshold,0.5);assert.equal(options.fallbackInView,false);return {ref:'ref',inView:viewed};}},'./useAuthSession':{default:()=>({token:'private-token',user:{id:'owner'}}),__esModule:true},'@/config':{apiUrl:'https://api.test/api/v1'},'@/utils':{getSessionId:()=> 'device',shouldSendLog:()=>true}});
 try{api.default('post');cleanup=effect();assert.equal(calls.length,0);timer();await Promise.resolve();assert.equal(calls.length,1);assert.equal(calls[0][0],'https://api.test/api/v1/posts/post/impressions');assert.equal(calls[0][1].headers.Authorization,'Bearer private-token');assert.equal(calls[0][1].keepalive,true);cleanup();
  viewed=false;api.default('post');effect();assert.equal(timer,null);viewed=true;global.document.visibilityState='hidden';api.default('post');effect();assert.equal(timer,null);
 }finally{global.document=prior.document;global.fetch=prior.fetch;global.setTimeout=prior.setTimeout;global.clearTimeout=prior.clearTimeout;}
});
