const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function worker(network=async request=>({body:'online',request})){
 const handlers={},deleted=[],cached=[];let stored;
 const context={URL,Response,Request:class{constructor(url,options){this.url=url;this.options=options;}},fetch:network,
 caches:{open:async()=>({addAll:async requests=>{cached.push(...requests);stored={body:'offline'};}}),keys:async()=>['kwonnet-pwa-v2','kwonnet-pwa-v4','unrelated-cache'],delete:async name=>deleted.push(name),match:async()=>stored},
 self:{location:{origin:'https://kwonnet.test'},addEventListener:(event,fn)=>handlers[event]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}}};
 vm.runInNewContext(fs.readFileSync('public/sw.js','utf8'),context);
 return {handlers,deleted,cached,install:async()=>{let work;handlers.install({waitUntil:p=>work=p});await work;},activate:async()=>{let work;handlers.activate({waitUntil:p=>work=p});await work;},fetch:async(path,options={})=>{let response;handlers.fetch({request:{url:'https://kwonnet.test'+path,method:'GET',mode:'cors',...options},respondWith:p=>response=p});return response&&await response;}};
}
test('manifest declares stable identity, standalone launch and real correctly sized icons',async()=>{
 const manifest=JSON.parse(fs.readFileSync('src/config/pwa-manifest.json'));assert.equal(manifest.name,'Kwonnet');assert.equal(manifest.id,'/');assert.equal(manifest.start_url,'/');assert.equal(manifest.scope,'/');assert.equal(manifest.display,'standalone');
 const sharp=require('sharp');for(const icon of manifest.icons){const metadata=await sharp('public'+icon.src).metadata();assert.equal(`${metadata.width}x${metadata.height}`,icon.sizes);assert.equal(icon.purpose,'any');}
 assert.match(fs.readFileSync('src/app/layout.tsx','utf8'),/rel="manifest" href="\/site.webmanifest" crossOrigin="use-credentials"/);
});
test('service worker caches only public fallback assets and cleans only its own obsolete caches',async()=>{
 const sw=worker();await sw.install();assert.ok(sw.cached.some(request=>request.url==='/offline.html'));assert.ok(sw.cached.every(request=>request.options.cache==='reload'));assert.ok(sw.cached.every(request=>!/^\/(api|messages|wallet|settings|_next)/.test(request.url)));await sw.activate();assert.deepEqual(sw.deleted,['kwonnet-pwa-v2']);assert.ok(sw.handlers.push&&sw.handlers.notificationclick,'existing notifications remain supported');
});
test('offline navigations get a generic screen, while API, RSC, mutations and cross-origin requests bypass caching',async()=>{
 const sw=worker(async()=>{throw Error('offline');});await sw.install();assert.equal((await sw.fetch('/messages/private/chat',{mode:'navigate'})).body,'offline');
 for(const path of ['/api/private','/settings?_rsc=abc','/media/private.png'])assert.equal(await sw.fetch(path),undefined);
 assert.equal(await sw.fetch('/post',{method:'POST'}),undefined);assert.equal(await sw.fetch('/elsewhere',{url:'https://other.test/page',mode:'navigate'}),undefined);
 const online=worker();await online.install();assert.equal((await online.fetch('/wallet',{mode:'navigate'})).body,'online');assert.ok(online.cached.every(request=>request.url!=='/wallet'));
});
test('offline fallback remains usable even if Cache Storage no longer has the preloaded screen',async()=>{
 const sw=worker(async()=>{throw Error('offline');});const response=await sw.fetch('/messages/private/chat',{mode:'navigate'});assert.equal(response.status,503);assert.match(await response.text(),/Reconnect/);
});
test('installation registers the worker without requesting notifications and waits for a user action to prompt',async()=>{
 const React=require('react'),ts=require('typescript'),{JSDOM}=require('jsdom');const dom=new JSDOM('<div id="root"></div>',{url:'https://kwonnet.test'});
 const previous={window:global.window,document:global.document,navigator:Object.getOwnPropertyDescriptor(global,'navigator'),act:global.IS_REACT_ACT_ENVIRONMENT};global.window=dom.window;global.document=dom.window.document;Object.defineProperty(global,'navigator',{configurable:true,value:dom.window.navigator});global.IS_REACT_ACT_ENVIRONMENT=true;
 const display=new dom.window.EventTarget();display.matches=false;window.matchMedia=()=>display;Object.defineProperty(window,'isSecureContext',{value:true});const registrations=[];Object.defineProperty(navigator,'serviceWorker',{value:{register:async(...args)=>registrations.push(args)}});
 const module={exports:{}};new Function('require','module','exports','process',ts.transpileModule(fs.readFileSync('src/providers/PwaProvider.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(require,module,module.exports,{env:{NODE_ENV:'production'}});
 let state,prompts=0;function Child(){state=module.exports.usePwaInstall();return React.createElement('span',null,state.canInstall?'Install':'Browser');}
 const root=require('react-dom/client').createRoot(document.getElementById('root'));
 try{
  await React.act(async()=>root.render(React.createElement(module.exports.default,null,React.createElement(Child))));assert.deepEqual(registrations,[['/sw.js',{scope:'/',updateViaCache:'none'}]]);assert.equal(state.canInstall,false);
  const event=new window.Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>prompts++;event.userChoice=Promise.resolve({outcome:'accepted'});await React.act(async()=>window.dispatchEvent(event));assert.equal(event.defaultPrevented,true);assert.equal(prompts,0);assert.equal(state.canInstall,true);
  await React.act(async()=>state.install());assert.equal(prompts,1);assert.equal(state.canInstall,false);await React.act(async()=>window.dispatchEvent(new window.Event('appinstalled')));assert.equal(state.canInstall,false);
 }finally{await React.act(async()=>root.unmount());dom.window.close();global.window=previous.window;global.document=previous.document;if(previous.navigator)Object.defineProperty(global,'navigator',previous.navigator);else delete global.navigator;global.IS_REACT_ACT_ENVIRONMENT=previous.act;}
});
