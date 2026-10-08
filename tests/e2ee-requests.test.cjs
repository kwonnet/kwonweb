const {test}=require('node:test');const assert=require('node:assert/strict');const {readFileSync}=require('node:fs');const ts=require('typescript');const React=require('react');const {JSDOM}=require('jsdom');const {createRoot}=require('react-dom/client');
test('a pending request previews silently, accepts only processed/visible IDs, and then enables receipts',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://kwonnet.com/messages/b/requests'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;document.hasFocus=()=>true;Object.defineProperty(document,'visibilityState',{value:'visible'});global.IntersectionObserver=class {constructor(cb){this.cb=cb;}observe(target){this.cb([{target,isIntersecting:true}]);}disconnect(){}};dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const calls=[],socketCalls=[],routes=[];const convo={id:'room',state:'PENDING_REQUEST',initiator:{id:'b'},responder:{id:'a'}};const chat={createdAt:new Date().toISOString(),id:'server-id',event:{eventId:'event-id'},conversation:'room',fromUserId:'b',content:'private preview',hash:'hash',seen:[],read:[]};
 const elements=({children,...props})=>React.createElement('div',{ref:props.ref,'data-message-id':props['data-message-id']},children);
 const context={messages:[chat,{...chat,id:'expired-id',createdAt:'2000-01-01T00:00:00.000Z',content:'archived expired preview'}],refresh:async()=>({conversation:convo}),revision:0,convoSocketIo:{on:()=>{},off:()=>{},emit:(...args)=>socketCalls.push(args)}};
 const mocks={
  '@mui/material':Object.fromEntries(['Alert','Avatar','Box','Paper','Stack','Typography','Dialog','DialogContent','DialogTitle','IconButton','TextField','Button'].map(name=>[name,name==='Button'?({children,onClick,disabled})=>React.createElement('button',{onClick,disabled},children):elements])),
  '@mui/icons-material':{ArrowBackIosNewOutlined:elements,AttachFile:elements,SendOutlined:elements,LockOutlined:elements},
  'next/link':{__esModule:true,default:elements},'next/navigation':{useRouter:()=>({replace:path=>routes.push(path),refresh:()=>{}})},
  '@/hooks':{useAuthSession:()=>({user:{id:'a'},token:'token'})},
  '@/context/ConvoSocketIoContext':{useConvoSocketIoContext:()=>context},
  '@/lib/signal/attachments':{IMAGE_TYPES:['image/png','image/jpeg','image/webp'],validateImageUploads:()=>{}},'@/lib/conversations':{createConversation:async()=>convo},
  '@/lib/conversations/messaging':{messagingAPI:async(...args)=>{calls.push(args);},sendContent:async()=>{},sendMedia:async()=>{},forgetConversation:async()=>{},hideMessage:async()=>{}},
  '@/types/conversation':{ConvoKind:{CHAT:'chat'}},'./ChatBubble':{__esModule:true,default:({message})=>React.createElement('span',null,message.content)},
 };
 const module={exports:{}};const source=ts.transpileModule(readFileSync('src/app/(dashboard)/messages/[[...slug]]/ChatBoxClient.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('require','module','exports',source)(name=>name in mocks?mocks[name]:require(name),module,module.exports);
 const root=createRoot(document.getElementById('root'));
 try{await React.act(async()=>root.render(React.createElement(module.exports.default,{params:{recipient:{id:'b',name:'Bob',username:'bob'},convo,recipientDevices:[],messages:[]}})));assert.match(document.body.textContent,/private preview/);assert.equal(calls.length,0,'no delivered/read event from preview');assert.equal(socketCalls.length,0,'no bootstrap or typing ACK');await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Accept').click());const accepted=calls.find(c=>c[2]==='/room/request');assert.deepEqual(accepted[4],{action:'accept',deliveredIds:['server-id'],readIds:['server-id']});assert.ok(routes.includes('/messages/b/chat'));}
 finally{await React.act(async()=>root.unmount());dom.window.close();delete global.IntersectionObserver;}
});
