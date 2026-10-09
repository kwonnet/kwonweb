const {test}=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {JSDOM}=require('jsdom');
function load(file,mocks){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(name=>name in mocks?mocks[name]:require(name),module,module.exports);return module.exports;}
test('receipt revision refreshes every loaded conversation page and its badges through the bound SWRInfinite cache',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://kwonnet.test/messages'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const {createRoot}=require('react-dom/client');const {SWRConfig}=require('swr');
 let revision=0,unread=2,inboxRevision=0,receiptTotals={};const pages=[];
 const rows=page=>Array.from({length:page===1?21:1},(_,index)=>({id:`${page}-${index}`,unreadCount:unread,initiator:{id:'user',user:{id:'user',name:'You'}},responder:{id:'peer',user:{id:'peer',name:'Peer'}}}));
 const List=load('src/app/(dashboard)/messages/[[...slug]]/ChatListClient.tsx',{
  '@/context/ConvoSocketIoContext':{useConvoSocketIoContext:()=>({liveReady:true,revision,inboxRevision,receiptTotals})},
  '@/hooks':{useAuthSession:()=>({user:{id:'user'},token:'token'})},
  '@/lib/conversations':{getUserChatConversations:async args=>{pages.push(args.page);return rows(args.page);}},
  'lodash/debounce':{__esModule:true,default:fn=>fn},
  './DisplayChatList':{__esModule:true,default:({convoList})=>React.createElement('div',null,convoList.map(row=>React.createElement('span',{key:row.id,'data-id':row.id},row.unreadCount)))},
  '@mui/material':{Box:({children})=>React.createElement('div',null,children),Button:({children,onClick,disabled})=>React.createElement('button',{onClick,disabled},children)},
 }).default;
 const cache=new Map(),config={provider:()=>cache,dedupingInterval:30000};const root=createRoot(document.getElementById('root'));
 const render=()=>root.render(React.createElement(SWRConfig,{value:config},React.createElement(List,{slug:'chat',convoList:rows(1)})));
 const settle=()=>React.act(async()=>{await new Promise(resolve=>setTimeout(resolve,20));});
 try{
  await React.act(async()=>render());await settle();
  await React.act(async()=>document.querySelector('button').click());await settle();
  assert.equal(document.querySelector('[data-id="2-0"]').textContent,'2');
  const before=pages.length;unread=0;inboxRevision++;revision++;
  await React.act(async()=>render());await settle();
  assert.ok(pages.slice(before).includes(1));assert.ok(pages.slice(before).includes(2),'the second page is refreshed as well');
  assert.equal(document.querySelector('[data-id="1-0"]').textContent,'0');assert.equal(document.querySelector('[data-id="2-0"]').textContent,'0');
  const after=pages.length;receiptTotals={'1-0':{unreadCount:4,unseenCount:4}};revision++;await React.act(async()=>render());await settle();assert.equal(pages.length,after,'known receipt totals patch every loaded row without refetching the list');assert.equal(document.querySelector('[data-id="1-0"]').textContent,'4');
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
test('receipt acknowledgement refreshes account badges immediately and keyboard viewport keeps the composer above its bottom',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://kwonnet.test/messages'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
 const viewport=new dom.window.EventTarget();viewport.height=800;viewport.offsetTop=0;Object.defineProperty(window,'visualViewport',{value:viewport});
 const own=['/v1/users/user/stats','token'],other=['/v1/users/other/stats','token'];const stats=new Map([[own,{totalUnreadMsg:5,totalUnseenMsg:5,totalAwards:2}],[other,{totalUnreadMsg:9,totalUnseenMsg:9}]]);
 let password,context,finishRestore,pathname='/messages';
 const box=({children,sx,...props})=>React.createElement('div',{'data-height':typeof sx?.height==='string'?sx.height:undefined},children);
 const button=({children,onClick,disabled,...props})=>React.createElement('button',{onClick,disabled,'aria-label':props['aria-label']},children);
 const provider=load('src/context/ConvoSocketIoContext.tsx',{
  '@/components/common/PasswordTextField':{__esModule:true,default:props=>{password=props;return null;}},
  '@/components/common/MessagingHistoryTransfer':{__esModule:true,default:()=>null},
  'next/navigation':{usePathname:()=>pathname},
  '@/lib/conversations':{getUserChatConversations:async()=>[]},
  '@mui/icons-material/MoreVert':{__esModule:true,default:()=>null},
  '@mui/material':{Alert:box,Box:box,Button:button,Dialog:({open,children})=>open?box({children}):null,DialogContent:box,DialogTitle:box,Paper:box,Stack:box,Typography:box,IconButton:button,Menu:({open,children})=>open?box({children}):null,MenuItem:button,Checkbox:()=>null,FormControlLabel:()=>null,CircularProgress:()=>null},
  '@/hooks':{useAuthSession:()=>({user:{id:'user'},token:'token'})},
  './SocketIoContext':{useSocketIoContext:()=>({})},
  '@/lib/signal/deviceManager':{hasMessagingVault:async()=>true,restoreRememberedMessaging:()=>new Promise(resolve=>{finishRestore=resolve;}),forgetRememberedMessaging:async()=>{},unlockMessaging:async()=>{},lockMessaging:()=>{}},
  '@/lib/conversations/messaging':{enroll:async()=>{},messagingAPI:async()=>[]},
  'swr':{useSWRConfig:()=>({mutate:async(filter,update)=>{for(const [key,value] of stats)if(filter(key)&&update)stats.set(key,update(value));}})}
 });
 const Viewport=load('src/app/(dashboard)/messages/MessagingViewport.tsx',{'@mui/material':{Box:box,Stack:box,Skeleton:()=>React.createElement('span',{'data-skeleton':true})},'@/context/ConvoSocketIoContext':{useConvoSocketIoContext:()=>provider.useConvoSocketIoContext()}}).default;
 function Child(){context=provider.useConvoSocketIoContext();return React.createElement(Viewport,null,'Chat',React.createElement(provider.MessagingOptionsButton));}
 const root=require('react-dom/client').createRoot(document.getElementById('root'));
 try{
  await React.act(async()=>root.render(React.createElement(provider.default,null,React.createElement('header',null,'App navigation'),React.createElement(Child))));
  assert.match(document.body.textContent,/App navigation/,'app shell remains mounted during automatic unlock');
  assert.ok(document.querySelector('[data-skeleton]'),'message pane shows skeleton during automatic unlock');
  assert.doesNotMatch(document.body.textContent,/Chat/,'encrypted message children do not mount until unlocked');
  await React.act(async()=>finishRestore(undefined));
  assert.match(document.body.textContent,/App navigation/,'app shell remains mounted while messaging is locked');
  const buttons=[...document.querySelectorAll('button')];assert.ok(buttons.findIndex(button=>button.textContent==='Unlock')<buttons.findIndex(button=>button.textContent==='Reset messaging on this browser'),'destructive reset follows unlock');
  await React.act(async()=>password.onChange({target:{value:'twelve-plus-characters'}}));
  await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Unlock').click());
  assert.ok(document.querySelector('[data-height="736px"]'));pathname='/foryou';await React.act(async()=>root.render(React.createElement(provider.default,null,React.createElement('header',null,'App navigation'),React.createElement(Child))));assert.equal(context.ready,true);pathname='/messages';await React.act(async()=>root.render(React.createElement(provider.default,null,React.createElement('header',null,'App navigation'),React.createElement(Child))));assert.equal(context.ready,true,'returning to messaging does not prompt again');
  await React.act(async()=>{viewport.height=400;viewport.offsetTop=60;viewport.dispatchEvent(new dom.window.Event('resize'));});
  assert.ok(document.querySelector('[data-height="396px"]'),'container ends at visual viewport bottom after keyboard/panning');
  await React.act(async()=>context.setActiveConversationId('room'));assert.equal(context.activeConversationId,undefined,'root inbox is not an active details pane');
  pathname='/messages/peer/chat';await React.act(async()=>root.render(React.createElement(provider.default,null,React.createElement(Child))));assert.equal(context.activeConversationId,'room');
  pathname='/messages/user/requests/list';await React.act(async()=>root.render(React.createElement(provider.default,null,React.createElement(Child))));assert.equal(context.activeConversationId,undefined,'list-only route has no active details pane');
  pathname='/wallet';await React.act(async()=>root.render(React.createElement(provider.default,null,React.createElement(Child))));assert.equal(context.activeConversationId,undefined,'other app pages do not mark messages read');
  pathname='/messages/peer/chat';await React.act(async()=>root.render(React.createElement(provider.default,null,React.createElement(Child))));assert.equal(context.activeConversationId,'room');
  await React.act(async()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new window.Event('visibilitychange'));});assert.equal(context.activeConversationId,undefined,'hidden browser tab does not clear unread counts');
  await React.act(async()=>{Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});document.dispatchEvent(new window.Event('visibilitychange'));});assert.equal(context.activeConversationId,'room');
  await React.act(async()=>context.refreshInbox('room',{unreadCount:0,unseenCount:0,totalUnreadMsg:1,totalUnseenMsg:0}));
  assert.deepEqual(stats.get(own),{totalUnreadMsg:1,totalUnseenMsg:0,totalAwards:2});assert.equal(stats.get(other).totalUnreadMsg,9);
  assert.deepEqual(context.receiptTotals.room,{unreadCount:0,unseenCount:0});
  assert.doesNotMatch(document.body.textContent,/Messaging devices|Lock messages/);
  await React.act(async()=>document.querySelector('[aria-label="Messaging options"]').click());
  assert.match(document.body.textContent,/Messaging devices/);assert.match(document.body.textContent,/Lock messages/);
  await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Lock messages').click());assert.match(document.body.textContent,/Unlock encrypted messages/);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
test('navbar message badge counts unread messages even after background delivery clears unseen totals',()=>{
 let stats={totalUnreadMsg:3,totalUnseenMsg:0};
 const ui=({children})=>React.createElement('div',null,children);
 const mocks={
  '@mui/material':{Badge:({children,badgeContent})=>React.createElement('span',{'data-message-count':badgeContent},children),Box:ui,Button:ui,IconButton:ui,Stack:ui,Tooltip:ui},
  './AccountMenu':{__esModule:true,default:()=>null},'./SearchToolbar':{__esModule:true,default:()=>null},'./AccountToolbar':{__esModule:true,default:()=>null},
  'next/link':{__esModule:true,default:ui},
  '@/hooks':{useAuthSession:()=>({user:{id:'user'},token:'token'})},
  '@/lib/swrHooks':{useUserStats:()=>({data:stats})},
 };
 for(const icon of ['EmailOutlined','NotificationsOutlined','AccountCircle','LocalMallOutlined'])mocks[`@mui/icons-material/${icon}`]={__esModule:true,default:()=>null};
 const Toolbar=load('src/components/common/CustomToolbarActions.tsx',mocks).default;
 const render=()=>require('react-dom/server').renderToStaticMarkup(React.createElement(Toolbar,{}));
 assert.match(render(),/data-message-count="3"/,'delivery alone does not erase unread navbar badge');
 stats={totalUnreadMsg:0,totalUnseenMsg:3};assert.match(render(),/data-message-count="0"/,'acknowledged reads clear the badge');
});

test('live sync metadata preserves participant profiles when updating the rendered conversation list',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://kwonnet.test/messages'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 let renderedRows;const ui=({children})=>React.createElement('div',null,children);
 const context={revision:0,inboxRevision:0,receiptTotals:{},conversationUpdates:{},messages:[],ready:false,liveReady:true};
 const row={id:'room',state:'ACCEPTED',kind:'chat',updatedAt:new Date().toISOString(),unreadCount:0,unseenCount:0,initiator:{id:'user',user:{id:'user',name:'You',username:'you'}},responder:{id:'peer',user:{id:'peer',name:'Peer',username:'peer',avatar:'/peer.png'}}};
 const Display=load('src/app/(dashboard)/messages/[[...slug]]/DisplayChatList.tsx',{
  '@/context/ConvoSocketIoContext':{useConvoSocketIoContext:()=>context},'@/hooks':{useAuthSession:()=>({user:{id:'user'}})},'@/utils':{formatRelativeTime:()=> 'now'},
  '@mui/icons-material':{CheckOutlined:ui,DoneAllOutlined:ui},'@mui/material':{Avatar:({src,alt})=>React.createElement('img',{src,alt}),Box:ui,Stack:ui,Typography:ui},'next/navigation':{usePathname:()=>'/messages',useRouter:()=>({push(){}})},
 }).default;
 const List=load('src/app/(dashboard)/messages/[[...slug]]/ChatListClient.tsx',{
  '@/context/ConvoSocketIoContext':{useConvoSocketIoContext:()=>context},'@/hooks':{useAuthSession:()=>({user:{id:'user'},token:'token'})},'@/lib/conversations':{getUserChatConversations:async()=>[row]},'lodash/debounce':{__esModule:true,default:fn=>fn},'./DisplayChatList':{__esModule:true,default:props=>{renderedRows=props.convoList;return React.createElement(Display,props);}},'@mui/material':{Box:ui,Button:ui},
 }).default;
 class Boundary extends React.Component{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?'CRASHED':this.props.children;}}
 const {SWRConfig}=require('swr'),root=require('react-dom/client').createRoot(document.getElementById('root'),{onCaughtError:()=>{}}),cache=new Map();
 const render=()=>root.render(React.createElement(SWRConfig,{value:{provider:()=>cache}},React.createElement(Boundary,null,React.createElement(List,{slug:'chat',convoList:[row],initialFetchFailed:true}))));
 try{
  await React.act(async()=>render());
  // Wait for the initial SWR request to commit before testing a live patch.
  for(let attempt=0;attempt<25;attempt++){
   if([...cache.values()].some(entry=>Array.isArray(entry.data)&&entry.data[0]?.id==='room'&&!entry.isValidating))break;
   await React.act(async()=>new Promise(resolve=>setTimeout(resolve,20)));
  }
  assert.match(document.body.textContent,/Peer/);
  for(const unread of [1,0]){
   context.conversationUpdates={room:{id:'room',state:'ACCEPTED',updatedAt:new Date().toISOString(),initiator:{id:'user',isPaid:false},responder:{id:'peer',isPaid:false},unreadCount:unread,unseenCount:unread}};context.revision++;
   await React.act(async()=>render());await React.act(async()=>new Promise(resolve=>setTimeout(resolve,20)));
   assert.doesNotMatch(document.body.textContent,/CRASHED/,'sending/receiving sync must not remove the profile required by the list row');
   assert.equal(renderedRows[0].unreadCount,unread,'the live update was applied to the row');assert.match(document.body.textContent,/Peer/);assert.equal(document.querySelector('img').getAttribute('src'),'/peer.png');
  }
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
