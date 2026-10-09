const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server'),{JSDOM}=require('jsdom');
function load(file){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(name=>require(name),module,module.exports);return module.exports.default;}
test('shared text and semantic colors meet small-text contrast requirements in both color schemes',()=>{
 const theme=load('src/providers/theme.ts'),{getContrastRatio}=require('@mui/material/styles');
 for(const mode of ['light','dark']){
  const palette=theme.colorSchemes[mode].palette;
  for(const background of [palette.background.default,palette.background.paper,mode==='light'?'#eeeeee':'#303030']){
   for(const color of [palette.text.primary,palette.text.secondary,palette.primary.main])assert.ok(getContrastRatio(color,background)>=4.5,`${mode}: ${color} against ${background}`);
  }
  for(const name of ['primary','info','success','warning','error'])assert.ok(getContrastRatio(palette[name].main,palette[name].contrastText)>=4.5,`${mode} ${name} button contrast`);
 }
});
test('interactive MUI badges expose their descendants while numeric badges remain decorative',()=>{
 const {Badge}=require('@mui/material');const dom=new JSDOM(renderToStaticMarkup(React.createElement(Badge,{slotProps:{badge:{'aria-hidden':false}},badgeContent:React.createElement('button',{'aria-label':'Follow author'},'+')},React.createElement('span',null,'Avatar'))));
 const button=dom.window.document.querySelector('button');assert.equal(button.closest('[aria-hidden="true"]'),null);assert.equal(button.parentElement.getAttribute('aria-hidden'),'false');dom.window.close();
 // Guard all call sites: MUI's badge slot hides content unless explicitly opted in.
 function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(`${dir}/${entry.name}`):entry.name.endsWith('.tsx')?[`${dir}/${entry.name}`]:[]);}
 const failures=[];for(const file of files('src')){
  const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function walk(n){if(ts.isJsxOpeningElement(n)&&n.tagName.getText(ast)==='Badge'){
   const props=n.attributes.properties,content=props.find(p=>p.name?.getText(ast)==='badgeContent');
   if(content?.initializer?.getText(ast).includes('<IconButton'))assert.match(props.find(p=>p.name?.getText(ast)==='slotProps')?.getText(ast)||'',/['"]aria-hidden['"]:\s*false/,file);
  }ts.forEachChild(n,walk)}walk(ast);
 }
});
test('AI catalog validates against the published schema and describes existing public artifacts',async()=>{
 const Ajv=require('ajv'),schema=JSON.parse(fs.readFileSync('tests/fixtures/ai-catalog.schema.json'));
 // Upstream 2020-12 schema uses only keywords with identical draft-07 semantics.
 // The installed Ajv engine validates those constraints without the dialect annotation.
 delete schema.$schema;const validate=new Ajv({allErrors:true}).compile(schema);
 const manifest=JSON.parse(fs.readFileSync('public/.well-known/ai-catalog.json'));
 assert.equal(validate(manifest),true,JSON.stringify(validate.errors));assert.equal(manifest.host.displayName,'Kwonnet');
 for(const entry of manifest.entries){const url=new URL(entry.url);assert.equal(url.origin,'https://kwonnet.com');assert.ok(fs.existsSync(`public${url.pathname}`));}
 const config=load('next.config.ts');assert.deepEqual(await config.rewrites(),[{source:'/ai-catalog.json',destination:'/.well-known/ai-catalog.json'}]);
 assert.match(fs.readFileSync('src/app/layout.tsx','utf8'),/rel="ai-catalog" type="application\/json" href="\/\.well-known\/ai-catalog.json"/);
});
test('robots.txt omits unsupported Host directive while retaining sitemap and private-path exclusions',()=>{
 const code=fs.readFileSync('src/app/robots.ts','utf8');const module={exports:{}};new Function('require','module','exports',ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(()=>({siteOrigin:()=> 'https://kwonnet.com'}),module,module.exports);
 const robots=module.exports.default();assert.equal(robots.host,undefined);assert.equal(robots.sitemap,'https://kwonnet.com/sitemap.xml');assert.ok(robots.rules.disallow.includes('/settings'));assert.ok(robots.rules.disallow.includes('/messages/'));
});
