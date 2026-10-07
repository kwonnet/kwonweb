const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const ts = require('typescript');
function load(path, mocks = {}) {
 const module = {exports: {}};
 const code = ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','module','exports',code)(name => name in mocks ? mocks[name] : require(name),module,module.exports);return module.exports;
}
const seo = load('src/lib/seo.ts');
const xml = load('src/lib/sitemap.ts',{'./seo':seo});
test('sitemap index includes the static sitemap and every public-content shard',()=>{
 const value = xml.sitemapIndex(3);
 assert.equal((value.match(/<sitemap>/g)||[]).length,4);
 for (const path of ['/sitemaps/static/sitemap.xml','/sitemaps/posts/0.xml','/sitemaps/posts/2.xml']) assert.ok(value.includes(seo.siteOrigin()+path));
 assert.ok(!value.includes('/settings'));
});
test('post sitemaps use canonical current handles, deduplicate URLs and omit invalid timestamps and paths',()=>{
 const posts = [{id:'post',updatedAt:'2025-01-01',user:{username:'legacy.handle'}},{id:'post',updatedAt:'2025-01-01',user:{username:'legacy.handle'}},
  {id:'other',updatedAt:'invalid',user:{username:'author'}},{id:'bad/path',updatedAt:'2025-01-01',user:{username:'author'}}];
 const value = xml.postSitemap(posts);
 assert.equal((value.match(/<url>/g)||[]).length,2);assert.ok(value.includes('/@legacy.handle/feed/post'));
 assert.ok(value.includes('2025-01-01T00:00:00.000Z'));assert.ok(!value.includes('invalid'));assert.ok(!value.includes('bad/path'));
 assert.equal(xml.xmlEscape('<&"\''),'&lt;&amp;&quot;&apos;');
});
test('sitemap outages return retryable errors instead of publishing an incomplete index',async()=>{
 const route = load('src/app/sitemap.xml/route.ts',{'@/lib/posts':{getPublicPostSitemapCount:async()=>null},'@/lib/sitemap':xml});
 const response = await route.GET();assert.equal(response.status,503);assert.equal(response.headers.get('retry-after'),'60');
 const ready = load('src/app/sitemap.xml/route.ts',{'@/lib/posts':{getPublicPostSitemapCount:async()=>2},'@/lib/sitemap':xml});
 assert.equal((await ready.GET()).headers.get('content-type'),'application/xml; charset=utf-8');
});
test('sitemap shards validate pages and never forward an authenticated session',async()=>{
 const calls = [];
 const route = load('src/app/sitemaps/posts/[page]/route.ts',{'@/lib/posts':{getPublicPostMetadataIndex:async page=>{calls.push(page);return []; }},'@/lib/sitemap':xml});
 assert.equal((await route.GET(new Request('https://kwonnet.test'),{params:Promise.resolve({page:'2.xml'})})).status,200);assert.deepEqual(calls,[2]);
 for(const page of ['-1.xml','50000.xml','private','1.xml?']) assert.equal((await route.GET(new Request('https://kwonnet.test'),{params:Promise.resolve({page})})).status,404);
 const api = load('src/lib/posts/index.ts',{'@/config':{apiUrl:'https://api.test/api/v1'}, '@/config/axios':{axiosAPI:{}}, '@/utils':{}, '@/utils/intent-errors':{}, react:{cache:fn=>fn}});
 const prior=global.fetch;
 try {global.fetch=async(url,options)=>{assert.equal(options.credentials,'omit');assert.equal(options.headers,undefined);return new Response(JSON.stringify(url.endsWith('/count')?{pages:2}:[]));};
  assert.equal(await api.getPublicPostSitemapCount(),2);assert.deepEqual(await api.getPublicPostMetadataIndex(1),[]);
 }finally{global.fetch=prior;}
});
