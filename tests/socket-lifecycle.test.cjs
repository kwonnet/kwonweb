const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const React=require('react');const {JSDOM}=require('jsdom');
test('token renewal keeps sockets stable and reconnect authentication uses the latest token',async()=>{
 const dom=new JSDOM('<div id="root"></div>');const prior={window:global.window,document:global.document,act:global.IS_REACT_ACT_ENVIRONMENT};global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 let auth={token:'first-token',user:{id:'ada',sessionId:'session-a'}};const connections=[];
 const module={exports:{}};const code=ts.transpileModule(fs.readFileSync('src/context/SocketIoContext.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const mocks={'@/config':{apiBaseUrl:'https://api.test'},'@/hooks':{useAuthSession:()=>auth},'socket.io-client':{io:(url,options)=>{const socket={url,options,closed:0,connected:true,active:true,connectCalls:0,connect(){this.connectCalls++;},on:()=>{},close(){this.closed++;}};connections.push(socket);return socket;}}};
 new Function('require','module','exports',code)(id=>id in mocks?mocks[id]:require(id),module,module.exports);
 const Provider=module.exports.default;const {createRoot}=require('react-dom/client');const root=createRoot(document.getElementById('root'));
 try{
  await React.act(async()=>root.render(React.createElement(Provider,null,'app')));assert.equal(connections.length,3);
  connections[0].connected=false;connections[0].active=false;auth={...auth,token:'renewed-token'};await React.act(async()=>root.render(React.createElement(Provider,null,'app')));
  assert.equal(connections.length,3);assert.ok(connections.every(socket=>socket.closed===0));assert.equal(connections[0].connectCalls,1);assert.equal(connections[1].connectCalls,0);
  for(const socket of connections)socket.options.auth(payload=>assert.deepEqual(payload,{token:'renewed-token'}));
  auth={token:'new-session-token',user:{id:'ada',sessionId:'session-b'}};await React.act(async()=>root.render(React.createElement(Provider,null,'app')));
  assert.equal(connections.length,6);assert.ok(connections.slice(0,3).every(socket=>socket.closed===1));
  auth={token:undefined,user:undefined};await React.act(async()=>root.render(React.createElement(Provider,null,'app')));assert.ok(connections.every(socket=>socket.closed===1));
  await React.act(async()=>root.unmount());
 }finally{global.window=prior.window;global.document=prior.document;global.IS_REACT_ACT_ENVIRONMENT=prior.act;dom.window.close();}
});
