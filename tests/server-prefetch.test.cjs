const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
function load(file,mocks){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(id=>mocks[id]??require(id),module,module.exports);return module.exports;}
const base={'@/lib/seo':{pageMetadata:()=>({})},'@/config':{apiUrl:'https://relay.test/api/v1'},'@/lib/server-session':{getServerSession:async()=>({user:{id:'owner',accessToken:'token'}})},'@/components/common/DisplayError':{__esModule:true,default:()=>null}};
test('wallet awaits parallel private balance/history requests and passes empty history as valid hydrated data',async()=>{
 const calls=[],pending=[];const previous=global.fetch;global.fetch=(url,options)=>{calls.push({url,options});return new Promise(resolve=>pending.push(()=>resolve({ok:true,json:async()=>url.includes('/history')?[]:{userId:'owner',coins:5,credit:0,bonus:0}})));};
 try{
  const Page=load('src/app/(dashboard)/wallet/page.tsx',{...base,'./WalletClient':{__esModule:true,default:()=>null},'@/utils':{getCurrent_ton_usd_rate:async()=>2},'@/components/common/NotificationServer':{getNotificationStatsCached:async()=>({totalTxns:0})}}).default;
  let rendered=false;const result=Page().then(value=>{rendered=true;return value;});await new Promise(resolve=>setImmediate(resolve));assert.equal(calls.length,2);assert.equal(rendered,false,'no client page is returned before required server data arrives');
  for(const call of calls){assert.equal(call.options.cache,'no-store');assert.equal(call.options.headers.Authorization,'Bearer token');}
  pending.forEach(release=>release());const element=await result;assert.equal(element.props.initialUserId,'owner');assert.equal(element.props.initialWallet.userId,'owner');assert.deepEqual(element.props.initialTransactions,[]);assert.equal(element.props.initialStats.totalTxns,0);
 }finally{global.fetch=previous;}
});
test('settings seeds both account configuration and sessions before hydration with the authenticated actor',async()=>{
 const calls=[];const previous=global.fetch;global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>url.includes('/sessions')?{sessions:[],page:1,hasMore:false}:{username:'owner',hasPassword:true,passwordSetupVerifiedUntil:null}};};
 try{const Page=load('src/app/(dashboard)/settings/page.tsx',{...base,'./PageClient':{__esModule:true,default:()=>null}}).default;const element=await Page();assert.equal(element.props.initialUserId,'owner');assert.equal(element.props.initialAccount.hasPassword,true);assert.deepEqual(element.props.initialSessions.sessions,[]);assert.equal(calls.length,2);assert.ok(calls.every(call=>call.options.cache==='no-store'&&call.options.headers.Authorization==='Bearer token'));}finally{global.fetch=previous;}
});
test('messaging server passes authenticated ciphertext preload into its keyed client and preserves fetch errors',async()=>{
 const previous=global.fetch;let ok=true;global.fetch=async(url,options)=>{assert.equal(options.cache,'no-store');assert.equal(options.headers.Authorization,'Bearer token');return {ok,status:503,text:async()=> 'Unavailable',json:async()=>({recipient:{id:'peer'},messages:[],initialSync:{userId:'owner',deviceId:'device',result:{messages:[{ciphertextB64:'encrypted'}]}}})};};
 try{const Component=load('src/app/(dashboard)/messages/[[...slug]]/ChatBoxServer.tsx',{...base,'./ChatBoxClient':{__esModule:true,default:()=>null}}).default;const element=await Component({recipientId:'peer',slug:'chat'});assert.equal(element.key,'peer');assert.equal(element.props.params.initialSync.result.messages[0].ciphertextB64,'encrypted');assert.equal(element.props.params.initialSync.userId,'owner');ok=false;const failure=await Component({recipientId:'peer',slug:'chat'});assert.equal(failure.props.status,503);assert.equal(failure.props.message,'Unavailable');}finally{global.fetch=previous;}
});
test('successful empty server inbox is hydrated without a browser request; failed preload retries normally',async()=>{
 const React=require('react'),{JSDOM}=require('jsdom'),{SWRConfig}=require('swr');
 for(const initialFetchFailed of [false,true]){
  const dom=new JSDOM('<div id="root"></div>',{url:'https://kwonnet.test/messages'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;let calls=0;
  const List=load('src/app/(dashboard)/messages/[[...slug]]/ChatListClient.tsx',{
   '@/context/ConvoSocketIoContext':{useConvoSocketIoContext:()=>({ready:false,liveReady:true,revision:0,messages:[]})},'@/hooks':{useAuthSession:()=>({user:{id:'owner'},token:'token'})},'@/lib/conversations':{getUserChatConversations:async()=>{calls++;return [];}},'lodash/debounce':{__esModule:true,default:fn=>fn},'./DisplayChatList':{__esModule:true,default:({convoList})=>React.createElement('div',null,`Rows: ${convoList.length}`)},'@mui/material':{Box:({children})=>React.createElement('div',null,children),Button:({children})=>React.createElement('button',null,children)}
  }).default;
  const cache=new Map(),root=require('react-dom/client').createRoot(document.getElementById('root'));
  try{await React.act(async()=>root.render(React.createElement(SWRConfig,{value:{provider:()=>cache,dedupingInterval:0}},React.createElement(List,{slug:'chat',convoList:[],initialFetchFailed}))));await React.act(async()=>new Promise(resolve=>setTimeout(resolve,20)));assert.match(document.body.textContent,/Rows: 0/);assert.equal(calls,initialFetchFailed?1:0);}
  finally{await React.act(async()=>root.unmount());dom.window.close();}
 }
});
test('concurrent wallet-history refreshes keep credentials scoped to each request and accept empty pages',async()=>{
 const previous=global.fetch,calls=[];
 global.fetch=async(url,options)=>{calls.push({url,options});await Promise.resolve();return {ok:true,json:async()=>[]};};
 try{
  const hooks=load('src/lib/swrHooks/index.ts',{'@/config':{apiUrl:'https://relay.test/api/v1'},'@/config/public-env':{publicEnv:()=> 'https://relay.test'},'@/config/axios':{axiosAPI:{}},'../wallets':{},'../auth':{}});
  const results=await Promise.all([hooks.getSWRTxnHistory('/v1/wallets/history?limit=20&page=1','alice-token'),hooks.getSWRTxnHistory('/v1/wallets/history?limit=20&page=1','bob-token')]);
  assert.deepEqual(calls.map(call=>call.options.headers.Authorization),['Bearer alice-token','Bearer bob-token']);assert.ok(calls.every(call=>call.options.cache==='no-store'));
  assert.deepEqual(results,[{data:[],nextCursor:''},{data:[],nextCursor:''}]);
 }finally{global.fetch=previous;}
});
