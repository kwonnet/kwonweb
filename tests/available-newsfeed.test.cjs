const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const React=require('react');const {JSDOM}=require('jsdom');
test('SSE availability stays pending until clicked, deduplicates, retries and closes on tab changes',async()=>{
 const dom=new JSDOM('<div id="root"></div>');const prior={window:global.window,document:global.document,EventSource:global.EventSource,act:global.IS_REACT_ACT_ENVIRONMENT};
 global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const streams=[];class Source{constructor(url){this.url=url;streams.push(this);}addEventListener(_,fn){this.receive=fn;}removeEventListener(){this.receive=null;}close(){this.closed=true;}}
 global.EventSource=Source;let state,fail=true;const applied=[];const requests=[];
 const module={exports:{}};const code=ts.transpileModule(fs.readFileSync('src/hooks/useAvailableNewsfeed.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('require','module','exports',code)(id=>id==='react'?React:id==='@/lib/posts'?{getAvailableNewsfeedPosts:async(...args)=>{requests.push(args);if(fail)throw Error('retry');return [{id:'new'}];}}:require(id),module,module.exports);
 const hook=module.exports.default;const {createRoot}=require('react-dom/client');const root=createRoot(document.getElementById('root'));
 function Probe({feed='following',enabled=true}){state=hook({feed,userId:'ada',token:'token',posts:[{id:'old'}],enabled,apply:async posts=>{applied.push(posts);}});return null;}
 try {
  await React.act(async()=>root.render(React.createElement(Probe)));
  assert.match(streams[0].url,/feed=following/);assert.ok(!streams[0].url.includes('token'));
  await React.act(async()=>streams[0].receive({data:JSON.stringify({feed:'following',ids:['old','new','new','new-b','new-c','new-d','../bad'],authors:[{postId:'old',id:'old-author',name:'Old',avatar:null},{postId:'new',id:'a',name:'Ada',avatar:'https://media.test/a.jpg'},{postId:'new-b',id:'b',name:'Ben',avatar:null},{postId:'new-c',id:'c',name:'Cara',avatar:null},{postId:'new-d',id:'a',name:'Ada',avatar:'https://media.test/a.jpg'}]})}));
  assert.equal(state.count,4);assert.equal(applied.length,0);assert.deepEqual(state.profiles.map(profile=>profile.id),['a','b','c']);
  await React.act(async()=>state.consume());assert.equal(state.count,4);assert.equal(state.error,'retry');
  fail=false;await React.act(async()=>state.consume());assert.equal(state.count,0);assert.equal(state.profiles.length,0);assert.equal(applied.length,1);assert.deepEqual(requests[1],['following',['new','new-b','new-c','new-d'],'token']);
  await React.act(async()=>streams[0].receive({data:JSON.stringify({feed:'following',ids:['new']})}));assert.equal(state.count,0);
  await React.act(async()=>root.render(React.createElement(Probe,{feed:'friends'})));assert.equal(streams[0].closed,true);assert.match(streams[1].url,/feed=friends/);
  await React.act(async()=>root.unmount());assert.equal(streams[1].closed,true);
 }finally{global.window=prior.window;global.document=prior.document;global.EventSource=prior.EventSource;global.IS_REACT_ACT_ENVIRONMENT=prior.act;dom.window.close();}
});
