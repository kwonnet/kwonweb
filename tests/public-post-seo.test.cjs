const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const ts = require('typescript');
function load(path, mocks = {}) {const module={exports:{}}; const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText; new Function('require','module','exports',code)(id=>id in mocks?mocks[id]:require(id),module,module.exports); return module.exports;}
test('only standalone post detail routes are public; settings and engagement routes stay protected',()=>{
 const policy=load('src/lib/auth-redirect.ts');
 assert.equal(policy.isPublicPostPath('/@author/feed/post'),true);
 for(const path of ['/settings','/@author/feed/post/gifters','/@author/feed/post/analytics','/@author','/@author/edit']) assert.equal(policy.isPublicPostPath(path),false);
});
test('guest post detail renders only the public API result and returns notFound for private posts',async()=>{
 const oldFetch=global.fetch; const calls=[];
 const Page=load('src/app/(dashboard)/[username]/feed/[id]/page.tsx',{
  'next/navigation':{notFound:()=>{throw new Error('not-found');}},
  '@/lib/seo-data':{postMetadata:async()=>({})},
  '../../embed/[id]/FeedCardItem':{__esModule:true,default:'public-post'},
  './PageClient':{__esModule:true,default:'private-post'},
  '@/components/common/DisplayError':{__esModule:true,default:'error'},
  '@/lib/server-session':{getServerSession:async()=>null},
  '@/config':{apiUrl:'https://api.test/api/v1'},
 }).default;
 try{
  global.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({id:'post',content:'Public text'}));};
  const result=await Page({params:Promise.resolve({id:'post'})});assert.equal(result.type,'public-post');assert.equal(result.props.post.content,'Public text');
  assert.equal(calls[0].url,'https://api.test/api/v1/posts/post/embed');assert.equal(calls[0].options.headers,undefined);assert.equal(calls[0].options.cache,'no-store');
  global.fetch=async()=>new Response(null,{status:404});await assert.rejects(Page({params:Promise.resolve({id:'private'})}),/not-found/);
 }finally{global.fetch=oldFetch;}
});
