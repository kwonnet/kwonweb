const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');const {JSDOM}=require('jsdom');
for(const state of ['ACCEPTED','PENDING_REQUEST'])for(const source of ['relay','matching-seed','wrong-device','wrong-account'])test(`background ${state} ${source} catch-up renders cached history before relay work and acknowledges only accepted delivery`,async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://kwonnet.test/messages'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const room=crypto.randomUUID(),convo={id:room,state,initiator:{id:'peer'},responder:{id:'user'},updatedAt:new Date().toISOString(),lastSequence:'2'},createdAt=new Date().toISOString();
 const cached={id:'cached',eventId:'cached',conversation:room,fromUserId:'peer',content:'Cached history',event:{eventId:'cached'},createdAt,seen:[],read:[]};const fresh={id:'new',eventId:'new',conversation:room,fromUserId:'peer',content:'Newest conversation message',event:{eventId:'new'},createdAt,seen:[],read:[]};
 const records={'wire:cached':JSON.stringify(cached),'event:cached':JSON.stringify({content:{kind:'text'}})};let local=[cached],context,release,started=0;const receipts=[];
 const box=({children})=>React.createElement('div',null,children);
 const mutate=async()=>{};
 const mocks={
  'next/navigation':{usePathname:()=>'/messages'},'@/hooks':{useAuthSession:()=>({user:{id:'user'},token:'token'})},'./SocketIoContext':{useSocketIoContext:()=>({})},
  '@/components/common/PasswordTextField':{__esModule:true,default:()=>null},'@mui/icons-material/MoreVert':{__esModule:true,default:()=>null},'@/components/common/MessagingHistoryTransfer':{__esModule:true,default:()=>null},
  '@mui/material':Object.fromEntries(['Alert','Box','Button','Dialog','DialogContent','DialogTitle','Paper','Stack','Typography','IconButton','Menu','MenuItem','Checkbox','FormControlLabel','CircularProgress'].map(name=>[name,name==='Dialog'||name==='Menu'?({open,children})=>open?box({children}):null:box])),
  '@/lib/signal/deviceManager':{hasMessagingVault:async()=>true,restoreRememberedMessaging:async()=>({}),forgetRememberedMessaging:async()=>{},lockMessaging:()=>{},currentMessagingRuntime:()=>({deviceId:'device',vault:{atomic:async work=>work({records})}})},
  '@/lib/conversations':{getUserChatConversations:async()=>[convo]},
  '@/lib/conversations/messaging':{enroll:async()=>{},flushMessagingOutbox:async()=>{},localConversation:async()=>local,syncMessages:async()=>{started++;return new Promise(resolve=>release=()=>resolve({conversation:convo,messages:[fresh],receipts:[],nextCursor:'2',nextReceiptCursor:'0'}));},decryptWire:async(userId,wire)=>{records['wire:new']=JSON.stringify(wire);records['event:new']=JSON.stringify({content:{kind:'text'}});local=[cached,fresh];},sendReceiptBatch:async(...args)=>{receipts.push(args);return {suppressed:false,unreadCount:2,unseenCount:0,totalUnreadMsg:2,totalUnseenMsg:0};}},
  'swr':{useSWRConfig:()=>({mutate})}
 };
 const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync('src/context/ConvoSocketIoContext.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(id=>mocks[id]??require(id),module,module.exports);
 function Child(){context=module.exports.useConvoSocketIoContext();React.useEffect(()=>{if(source!=='relay')void context.refresh(room,'peer',{userId:source==='wrong-account'?'another':'user',deviceId:source==='wrong-device'?'another':'device',result:{conversation:convo,messages:[fresh],receipts:[],nextCursor:'2',nextReceiptCursor:'0'}});},[]);return React.createElement('div',null,context.messages.map(message=>message.content).join('|'));}
 const root=require('react-dom/client').createRoot(document.getElementById('root'));
 try{
  await React.act(async()=>root.render(React.createElement(module.exports.default,null,React.createElement(Child))));
  if(source==='matching-seed') {
    assert.equal(started,0,'matching server ciphertext avoids a duplicate first relay request');
  } else {
    assert.equal(started,1);assert.match(document.body.textContent,/Cached history/);assert.doesNotMatch(document.body.textContent,/Newest conversation message/);assert.equal(context.loadingConversations[room],true);
    await React.act(async()=>release());
  }
  assert.match(document.body.textContent,/Newest conversation message/);assert.equal(context.loadingConversations[room],false);
  if(state==='ACCEPTED')assert.deepEqual(receipts,[['user','token',room,['new'],[]]],'inbox catch-up sends delivered, never read');else assert.deepEqual(receipts,[],'request preview remains silent');
  assert.equal(context.processed.length,2,JSON.stringify(context.processed));
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
