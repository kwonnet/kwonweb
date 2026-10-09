const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file){const module={exports:{}};new Function('module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(module,module.exports);return module.exports;}
test('launch preference follows OS theme before hydration and refreshes a stable manifest URL',()=>{
 const {pwaThemeScript}=load('src/utils/pwa-theme.ts');let cookie='',listener,refreshes=0;
 const scheme={matches:true,addEventListener:(event,fn)=>{assert.equal(event,'change');listener=fn;}};
 const link={href:'/site.webmanifest',cloneNode:()=>link,replaceWith:()=>refreshes++};
 const document={get cookie(){return cookie;},set cookie(value){cookie=value;},querySelector:()=>link};
 vm.runInNewContext(pwaThemeScript,{window:{matchMedia:query=>{assert.equal(query,'(prefers-color-scheme: dark)');return scheme;}},document,location:{protocol:'https:'}});
 assert.match(cookie,/kwonnet-pwa-theme=dark/);assert.match(cookie,/SameSite=Lax; Secure/);assert.equal(link.href,'/site.webmanifest');
 scheme.matches=false;listener();assert.match(cookie,/kwonnet-pwa-theme=light/);scheme.matches=true;listener();assert.match(cookie,/kwonnet-pwa-theme=dark/);assert.equal(refreshes,3);listener();assert.equal(refreshes,3,'unchanged preference does not repeatedly reload manifest');
});
test('the stable manifest endpoint selects theme without changing app identity or caching cookie-dependent colors',async()=>{
 const base=JSON.parse(fs.readFileSync('src/config/pwa-manifest.json')),colors=load('src/config/pwa-splash.ts').pwaSplashColors,module={exports:{}};
 const source=ts.transpileModule(fs.readFileSync('src/app/site.webmanifest/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',source)(name=>name==='@/config/pwa-manifest.json'?base:{pwaSplashColors:colors},module,module.exports);
 const get=theme=>module.exports.GET({cookies:{get:()=>theme?{value:theme}:undefined}});
 const light=get('light'),dark=get('dark'),unknown=get('invalid');const lightData=await light.json(),darkData=await dark.json();
 assert.equal(darkData.background_color,'#111111');assert.equal(darkData.theme_color,'#111111');assert.deepEqual({...darkData,background_color:lightData.background_color,theme_color:lightData.theme_color},lightData);assert.deepEqual(await unknown.json(),lightData);
 assert.equal(dark.headers.get('cache-control'),'no-store');assert.equal(dark.headers.get('vary'),'Cookie');assert.match(dark.headers.get('content-type'),/application\/manifest\+json/);
});
test('startup images match device resolution, orientation, and OS theme with real public PNGs',async()=>{
 const sharp=require('sharp'),{pwaSplashScreens,pwaStartupImages,pwaSplashColors}=load('src/config/pwa-splash.ts');
 assert.equal(pwaStartupImages.length,pwaSplashScreens.length*4);
 for(const image of pwaStartupImages){
  const [,width,height,scale,orientation,mode]=image.href.match(/\/(\d+)x(\d+)-(\d+)-(portrait|landscape)-(light|dark)\.png$/);
  const path='public'+image.href,metadata=await sharp(path).metadata();assert.equal(metadata.width,Number(orientation==='portrait'?width:height)*Number(scale));assert.equal(metadata.height,Number(orientation==='portrait'?height:width)*Number(scale));
  const {data}=await sharp(path).extract({left:0,top:0,width:1,height:1}).raw().toBuffer({resolveWithObject:true});const expected=parseInt(pwaSplashColors[mode].slice(1,3),16);assert.equal(data[0],expected);assert.equal(data[1],expected);assert.equal(data[2],expected);
  assert.match(image.media,new RegExp(`prefers-color-scheme: ${mode}`));assert.match(image.media,new RegExp(`orientation: ${orientation}`));
 }
});
