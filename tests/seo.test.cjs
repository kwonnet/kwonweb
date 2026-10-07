const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync, readdirSync} = require('node:fs');
const ts = require('typescript');
function load(path, mocks = {}) {
 const module = {exports: {}};
 const code = ts.transpileModule(readFileSync(path, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','module','exports', code)(id => id in mocks ? mocks[id] : require(id), module, module.exports);
 return module.exports;
}
const seo = load('src/lib/seo.ts');
test('metadata supplies canonical, robots, Open Graph and Twitter without tracking parameters', () => {
 const metadata = seo.pageMetadata('Settings','Manage your account.','/settings');
 assert.equal(metadata.robots.index, false); assert.equal(metadata.alternates.canonical, `${seo.siteOrigin()}/settings`);
 assert.equal(metadata.twitter.card, 'summary_large_image'); assert.equal(metadata.openGraph.siteName, 'Kwonnet');
 assert.equal(seo.pageMetadata('Home','Discover Kwonnet.','/',true).robots.index,true);
});
test('descriptions use visible text, remove markup and omit Draft.js entity secrets', () => {
 assert.equal(seo.plainDescription(JSON.stringify({blocks: [{text: 'Visible post'}], entityMap: {0: {secret: 'hidden'}}})), 'Visible post');
 assert.equal(seo.plainDescription('<p>Hello</p> world'), 'Hello world'); assert.equal(seo.plainDescription('x'.repeat(400)).length,160);
 assert.equal(seo.pageMetadata('Post','Description','/',true,'javascript:alert(1)').openGraph.images[0].url, `${seo.siteOrigin()}/android-chrome-512x512.png`);
});
test('all pages define static metadata or generateMetadata through the Next.js server API', () => {
 let count = 0;
 function walk(path) {for (const entry of readdirSync(path, {withFileTypes:true})) {const file = `${path}/${entry.name}`; if (entry.isDirectory()) walk(file); else if (entry.name === 'page.tsx') {const source = readFileSync(file,'utf8'); assert.match(source,/export (const metadata|async function generateMetadata)/, file); assert.doesNotMatch(source,/^["']use client["']/m, file); count++;}}}
 walk('src/app'); assert.ok(count > 50);
});
test('dynamic previews never forward session credentials and fall back safely when metadata is private', async () => {
 const oldFetch = global.fetch; const calls = [];
 const shared = {'@/config': {apiUrl: 'https://api.test/api/v1'}, '@/config/axios': {axiosAPI: {}}, '@/utils': {}, '@/utils/intent-errors': {}, react: {cache: fn => fn}};
 const postApi = load('src/lib/posts/index.ts', shared);
 const userApi = load('src/lib/users/index.ts', shared);
 const gameApi = load('src/lib/games/index.ts', shared);
 const data = load('src/lib/seo-data.ts', {'server-only': {}, react: shared.react, '@/lib/posts': postApi, '@/lib/users': userApi, '@/lib/games': gameApi, './seo': seo});
 try {
  global.fetch = async (url, options) => {calls.push({url, options}); return new Response(JSON.stringify({id: 'post', content: 'Public post', user: {name: 'Author',username:'author'},media:[]}));};
  const metadata = await data.postMetadata('@wrong-handle','post',true);
  assert.equal(metadata.robots.index,false); assert.equal(metadata.alternates.canonical,`${seo.siteOrigin()}/@author/feed/post`);
  assert.equal(calls[0].options.headers,undefined); assert.equal(calls[0].options.cache,'no-store'); assert.equal(calls[0].options.credentials,'omit');
  global.fetch = async () => new Response(null,{status:404});
  const hidden = await data.postMetadata('@author','private',true); assert.equal(hidden.robots.index,false); assert.equal(hidden.description,'View this post on Kwonnet.');
  global.fetch = async () => {throw new Error('private network error');};
  assert.equal((await data.profileMetadata('@author')).title,'Profile');
 } finally {global.fetch = oldFetch;}
});
