const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {JSDOM}=require('jsdom');
function compile(file,mocks){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(name=>name in mocks?mocks[name]:require(name),module,module.exports);return module.exports.default;}
test('send appears before network acknowledgement, preserves new input and reconciles by event ID without duplicates',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://kwonnet.test/messages/peer/chat'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;document.hasFocus=()=>true;Object.defineProperty(document,'visibilityState',{value:'visible'});dom.window.HTMLElement.prototype.scrollIntoView=()=>{};global.IntersectionObserver=class{observe(){}disconnect(){}};
 const convo={id:crypto.randomUUID(),state:'ACCEPTED',initiator:{id:'user'},responder:{id:'peer'}};
 let input,resolveSend,rejectSend,calls=[],badgeRefreshes=0;
 const context={messages:[],processed:[],liveReady:true,revision:0,refreshInbox:()=>badgeRefreshes++,refresh:async()=>({conversation:convo}),convoSocketIo:{on(){},off(){},emit(){}}};
 const ui=({children,ref,...props})=>React.createElement('div',{ref,'data-message-id':props['data-message-id']},children);
 class MessageQueuedError extends Error{}
 const mocks={
 '@mui/material':Object.fromEntries(['Alert','Avatar','Box','Button','Dialog','DialogContent','DialogTitle','IconButton','Paper','Stack','TextField','Typography'].map(name=>[name,name==='TextField'?props=>{input=props;return React.createElement('textarea',{value:props.value,onChange:props.onChange});}:name==='IconButton'?({children,onClick,disabled,...props})=>React.createElement('button',{onClick,disabled,'aria-label':props['aria-label']},children):ui])),
 '@mui/icons-material':{ArrowBackIosNewOutlined:ui,AttachFile:ui,SendOutlined:ui,LockOutlined:ui},'next/link':{__esModule:true,default:ui},'next/navigation':{useRouter:()=>({})},'@/hooks':{useAuthSession:()=>({user:{id:'user'},token:'token'})},'@/context/ConvoSocketIoContext':{useConvoSocketIoContext:()=>context,MessagingOptionsButton:()=>null},'@/lib/conversations':{},'@/lib/signal/attachments':{IMAGE_TYPES:['image/png'],validateImageUploads:()=>{}},
 '@/lib/conversations/messaging':{MessageQueuedError,sendContent:(...args)=>{calls.push(args);return new Promise((resolve,reject)=>{resolveSend=resolve;rejectSend=reject;});}},
 './ChatBubble':{__esModule:true,default:({message})=>React.createElement('span',{'data-event-id':message.eventId},`${message.content}:${message.sendingState??'confirmed'}`)}};
 const Chat=compile('src/app/(dashboard)/messages/[[...slug]]/ChatBoxClient.tsx',mocks),root=require('react-dom/client').createRoot(document.getElementById('root'));
 const render=()=>root.render(React.createElement(Chat,{params:{recipient:{id:'peer',name:'Peer',username:'peer'},convo}}));
 try{
  await React.act(async()=>render());
  await React.act(async()=>input.onChange({target:{value:'hello'}}));
  await React.act(async()=>document.querySelector('[aria-label="Send message"]').click());
  assert.match(document.body.textContent,/hello:sending/);assert.equal(input.value,'');assert.equal(calls.length,1);
  const eventId=calls[0][5];assert.ok(eventId);assert.equal(document.querySelector('[data-event-id]').dataset.eventId,eventId);
  await React.act(async()=>input.onChange({target:{value:'next message'}}));
  await React.act(async()=>resolveSend({eventId}));assert.match(document.body.textContent,/hello:sent/);assert.equal(input.value,'next message');assert.equal(badgeRefreshes,1);
  context.messages=[{id:'server-id',eventId,conversation:convo.id,fromUserId:'user',content:'hello',seen:[],read:[],event:{eventId},hash:'hash'}];
  await React.act(async()=>render());assert.equal(document.querySelectorAll('[data-event-id]').length,1);assert.match(document.body.textContent,/hello:confirmed/);
  await React.act(async()=>document.querySelector('[aria-label="Send message"]').click());
  await React.act(async()=>rejectSend(new Error('Recipient has not enrolled')));assert.match(document.body.textContent,/next message:failed/);assert.equal(input.value,'next message','failed preflight preserves text for retry');
 }finally{await React.act(async()=>root.unmount());dom.window.close();delete global.IntersectionObserver;}
});
test('sender receipts distinguish sent, delivered, read, sending and failures with accessible labels',()=>{
 const ui=({children,...props})=>React.createElement('div',{'aria-label':props['aria-label'],style:props.sx?.color?{color:props.sx.color}:undefined},children);
 const mocks={'@mui/material':Object.fromEntries(['Box','Button','Chip','Paper','Stack','Typography','IconButton','Menu','MenuItem','Popover'].map(name=>[name,ui])),'@mui/icons-material':{DoneAllOutlined:ui,CheckOutlined:ui,AddReactionOutlined:ui},'@/lib/conversations/messaging':{}};
 const Bubble=compile('src/app/(dashboard)/messages/[[...slug]]/ChatBubble.tsx',mocks),{renderToStaticMarkup}=require('react-dom/server');
 const message={createdAt:new Date().toISOString(),toUserId:'peer',content:'hello',seen:[],read:[],event:{eventId:'id'},reactions:[]};
 const render=m=>renderToStaticMarkup(React.createElement(Bubble,{message:m,isSender:true}));
 assert.match(render(message),/aria-label="Sent"/);
 assert.match(render({...message,seen:[{userId:'peer'}]}),/aria-label="Delivered"/);
 const read=render({...message,read:[{userId:'peer'}]});assert.match(read,/aria-label="Read"/);assert.match(read,/#64b5f6/);
 assert.match(render({...message,sendingState:'sending'}),/Sending/);assert.match(render({...message,sendingState:'failed'}),/Not sent/);
});
test('one initial request disables the composer and re-enables it when acceptance arrives',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://kwonnet.test/messages/peer/chat'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;document.hasFocus=()=>true;Object.defineProperty(document,'visibilityState',{value:'visible'});global.IntersectionObserver=class{observe(){}disconnect(){}};
 const convo={id:crypto.randomUUID(),state:'PENDING_REQUEST',requestMessageSent:false,initiator:{id:'user'},responder:{id:'peer'}};
 let field,calls=0;const context={messages:[],processed:[],revision:0,liveReady:true,refresh:async()=>({conversation:convo})};
 const ui=({children,ref})=>React.createElement('div',{ref},children);
 class MessageQueuedError extends Error{}
 const mocks={
  '@mui/material':Object.fromEntries(['Alert','Avatar','Box','Button','Dialog','DialogContent','DialogTitle','IconButton','Paper','Stack','TextField','Typography','CircularProgress'].map(name=>[name,name==='TextField'?props=>{field=props;return React.createElement('textarea',{disabled:props.disabled,value:props.value,onChange:props.onChange});}:name==='IconButton'?({children,onClick,disabled,...props})=>React.createElement('button',{onClick,disabled,'aria-label':props['aria-label']},children):ui])),
  '@mui/icons-material':{ArrowBackIosNewOutlined:ui,AttachFile:ui,SendOutlined:ui,LockOutlined:ui},'next/link':{__esModule:true,default:ui},'next/navigation':{useRouter:()=>({})},'@/hooks':{useAuthSession:()=>({user:{id:'user'},token:'token'})},'@/context/ConvoSocketIoContext':{useConvoSocketIoContext:()=>context,MessagingOptionsButton:()=>null},'@/lib/conversations':{},'@/lib/signal/attachments':{IMAGE_TYPES:['image/png'],validateImageUploads:()=>{}},'@/lib/conversations/messaging':{MessageQueuedError,sendContent:async()=>{calls++;}},'./ChatBubble':{__esModule:true,default:({message})=>React.createElement('span',null,message.content)}
 };
 const Chat=compile('src/app/(dashboard)/messages/[[...slug]]/ChatBoxClient.tsx',mocks),root=require('react-dom/client').createRoot(document.getElementById('root'));
 const render=()=>root.render(React.createElement(Chat,{params:{recipient:{id:'peer',name:'Peer',username:'peer'},convo}}));
 try{
  await React.act(async()=>render());assert.equal(document.querySelector('textarea').disabled,false);
  await React.act(async()=>field.onChange({target:{value:'First request'}}));await React.act(async()=>document.querySelector('[aria-label="Send message"]').click());
  assert.equal(calls,1);assert.equal(document.querySelector('textarea').disabled,true);assert.equal(document.querySelector('[aria-label="Attach images up to 500 KB"]').disabled,true);assert.match(document.body.textContent,/Wait for this person to accept/);
  await React.act(async()=>field.onChange({target:{value:'Another'}}));await React.act(async()=>field.onKeyDown({key:'Enter',shiftKey:false,nativeEvent:{isComposing:false},preventDefault(){}}));assert.equal(calls,1,'a stale input handler cannot bypass the pending-request guard');
  convo.state='ACCEPTED';context.revision++;await React.act(async()=>render());assert.equal(document.querySelector('textarea').disabled,false);
  await React.act(async()=>document.querySelector('[aria-label="Send message"]').click());assert.equal(calls,2);
 }finally{await React.act(async()=>root.unmount());dom.window.close();delete global.IntersectionObserver;}
});
test('list sync stays quiet and active accepted conversations suppress only their own badge',()=>{
 let pathname='/messages/peer/chat';
 const container=({children,...props})=>React.createElement('div',{'aria-label':props['aria-label']},children);
 const mocks={'@/hooks':{useAuthSession:()=>({user:{id:'me'}})},'next/navigation':{usePathname:()=>pathname,useRouter:()=>({})},'@/utils':{formatRelativeTime:()=> 'now'},'@mui/material':Object.fromEntries(['Avatar','Box','Stack','Typography'].map(name=>[name,container])),'@mui/icons-material':{CheckOutlined:container,DoneAllOutlined:container}};
 const List=compile('src/app/(dashboard)/messages/[[...slug]]/DisplayChatList.tsx',mocks),{renderToStaticMarkup}=require('react-dom/server');
 const item={id:'room',state:'ACCEPTED',unreadCount:2,previewLoading:true,initiator:{id:'peer',user:{id:'peer',name:'Peer',username:'peer'}},responder:{id:'me'},lastMessage:{content:'Last message',fromUserId:'peer',seen:[],read:[]}};
 const render=()=>renderToStaticMarkup(React.createElement(List,{convoList:[item]}));
 let html=render();assert.match(html,/Last message/);assert.doesNotMatch(html,/Syncing preview|unread messages/);
 pathname='/messages/another/chat';assert.match(render(),/2 unread messages/);
 pathname='/messages/peer/requests';item.state='PENDING_REQUEST';assert.match(render(),/2 unread messages/,'silent pending preview does not imply an accepted/read conversation');
});
