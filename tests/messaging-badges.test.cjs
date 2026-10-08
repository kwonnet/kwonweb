const {test}=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {JSDOM}=require('jsdom');
function load(file,mocks){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(name=>name in mocks?mocks[name]:require(name),module,module.exports);return module.exports;}
test('receipt revision refreshes every loaded conversation page and its badges through the bound SWRInfinite cache',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://kwonnet.test/messages'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const {createRoot}=require('react-dom/client');const {SWRConfig}=require('swr');
 let revision=0,unread=2;const pages=[];
 const rows=page=>Array.from({length:page===1?21:1},(_,index)=>({id:`${page}-${index}`,unreadCount:unread}));
 const List=load('src/app/(dashboard)/messages/[[...slug]]/ChatListClient.tsx',{
  '@/context/ConvoSocketIoContext':{useConvoSocketIoContext:()=>({liveReady:true,revision})},
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
  const before=pages.length;unread=0;revision++;
  await React.act(async()=>render());await settle();
  assert.ok(pages.slice(before).includes(1));assert.ok(pages.slice(before).includes(2),'the second page is refreshed as well');
  assert.equal(document.querySelector('[data-id="1-0"]').textContent,'0');assert.equal(document.querySelector('[data-id="2-0"]').textContent,'0');
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
