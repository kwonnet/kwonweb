const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {JSDOM}=require('jsdom');
test('hold opens actions, scrolling cancels a hold, double tap replies, quote navigates, and reaction picker groups counts',async(t)=>{
 const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 t.mock.timers.enable({apis:['setTimeout','Date'],now:Date.now()});
 let paper,picker;const actions=[],jumps=[];
 const container=({children})=>React.createElement('div',null,children);
 const button=({children,onClick,disabled,...props})=>React.createElement('button',{onClick,disabled,'aria-label':props['aria-label']},children);
 const mocks={
  '@mui/material':{Box:props=>props.component==='button'?button(props):container(props),Button:button,Chip:({label,onClick,...props})=>button({...props,onClick,children:label}),Paper:props=>{paper=props;return container(props);},Stack:container,Typography:container,IconButton:button,Menu:({open,children})=>open?container({children}):null,MenuItem:button,Popover:({open,children})=>open?container({children}):null},
  '@mui/icons-material':{DoneAllOutlined:container,CheckOutlined:container,AddReactionOutlined:container},
  'next/dynamic':{__esModule:true,default:()=>props=>{picker=props;return React.createElement('div',null,'Emoji picker');}},
  'emoji-picker-react':{EmojiStyle:{NATIVE:'native'},Theme:{AUTO:'auto'}},'@/lib/conversations/messaging':{}
 };
 const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync('src/app/(dashboard)/messages/[[...slug]]/ChatBubble.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(id=>id in mocks?mocks[id]:require(id),module,module.exports);
 const message={id:'child',eventId:'child-event',createdAt:new Date().toISOString(),fromUserId:'me',toUserId:'peer',content:'Child',seen:[],read:[],event:{eventId:'child-event'},reactions:[{userId:'peer',reaction:'😂'},{userId:'me',reaction:'😂'},{userId:'peer',reaction:'😂'}],reply:{targetId:'original',targetHash:'hash'}};
 const original={fromUserId:'peer',content:'Original quoted text',eventId:'original'};
 const root=require('react-dom/client').createRoot(document.getElementById('root'));
 const target=document.createElement('span'),anchor=document.createElement('div');
 const pointer={target,currentTarget:anchor,clientX:10,clientY:10,pointerType:'touch'};
 try{
  await React.act(async()=>root.render(React.createElement(module.exports.default,{message,isSender:true,userId:'me',replyMessage:original,onReplyClick:id=>jumps.push(id),onAction:(...args)=>actions.push(args)})));
  assert.doesNotMatch(document.body.textContent,/Delete for everyone|Delete for me|Edit/);
  assert.equal([...document.querySelectorAll('button')].filter(b=>b.textContent==='😂 2').length,1,'one chip per emoji with distinct-user count');
  await React.act(async()=>document.querySelector('[aria-label="Go to replied message"]').click());assert.deepEqual(jumps,['original']);assert.match(document.body.textContent,/Original quoted text/);
  await React.act(async()=>paper.onPointerDown(pointer));
  await React.act(async()=>paper.onPointerMove({...pointer,clientY:40}));
  await React.act(async()=>t.mock.timers.tick(600));assert.doesNotMatch(document.body.textContent,/Delete for everyone/);
  await React.act(async()=>paper.onPointerDown(pointer));await React.act(async()=>t.mock.timers.tick(500));assert.match(document.body.textContent,/Delete for everyone/);
  await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Edit').click());assert.deepEqual(actions.pop(),['edit']);assert.doesNotMatch(document.body.textContent,/Delete for everyone/);
  await React.act(async()=>paper.onPointerDown(pointer));await React.act(async()=>paper.onPointerUp(pointer));await React.act(async()=>t.mock.timers.tick(100));await React.act(async()=>paper.onPointerDown(pointer));await React.act(async()=>paper.onPointerUp(pointer));assert.deepEqual(actions.pop(),['reply']);
  await React.act(async()=>document.querySelector('[aria-label="Add reaction"]').click());assert.match(document.body.textContent,/Emoji picker/);
  await React.act(async()=>picker.onEmojiClick({emoji:'🧑🏽‍💻'}));assert.deepEqual(actions.pop(),['reaction','🧑🏽‍💻']);assert.doesNotMatch(document.body.textContent,/Emoji picker/);
 }finally{await React.act(async()=>root.unmount());dom.window.close();t.mock.timers.reset();}
});
