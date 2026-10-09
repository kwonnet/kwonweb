const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server'),{JSDOM}=require('jsdom');
function load(file,mocks){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(name=>name in mocks?mocks[name]:require(name),module,module.exports);return module.exports.default;}
function files(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(directory,entry.name)):entry.name.endsWith('.tsx')?[path.join(directory,entry.name)]:[]);}
test('icon-only controls across the app have a direct accessible name, independent of tooltip ancestors',()=>{
 const failures=[];
 for(const file of files('src')){
  const source=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function walk(node){if(ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node)){
   if(['IconButton','Fab'].includes(node.tagName.getText(ast))){
    const attributes=node.attributes.properties;
    const name=attributes.find(a=>['aria-label','aria-labelledby','title'].includes(a.name?.getText(ast)));
    if(!name?.initializer || (ts.isStringLiteral(name.initializer)&&!name.initializer.text.trim()))failures.push(`${file}:${ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1}`);
   }
  }ts.forEachChild(node,walk);}walk(ast);
 }
 assert.deepEqual(failures,[],`Unnamed icon controls: ${failures.join(', ')}`);
});
test('guest composer avatar link remains named when it renders a fallback icon instead of an image',()=>{
 let user={};const box=({children})=>React.createElement('div',null,children);
 const Component=load('src/app/(dashboard)/(home)/CreateTopSection.tsx',{
  'next/dynamic':{__esModule:true,default:()=>()=>null},'@/utils/guest-auth-trigger':{},'@/hooks':{useAuthSession:()=>({user})},'@/types/post':{FeedTypeEnum:{FORYOU:'foryou'}},
  '@mui/material':{Avatar:()=>React.createElement('svg',{'aria-hidden':true}),Box:box,Button:box,Card:box,Stack:box,TextField:()=>null},
  'next/link':{__esModule:true,default:({children,href,...props})=>React.createElement('a',{href,'aria-label':props['aria-label']},children)},
 });
 let dom=new JSDOM(renderToStaticMarkup(React.createElement(Component)));let link=dom.window.document.querySelector('a');assert.equal(link.getAttribute('href'),'/?auth=signin');assert.equal(link.getAttribute('aria-label'),'Sign in to create a post');dom.window.close();
 user={id:'user',username:'alice',name:'Alice'};dom=new JSDOM(renderToStaticMarkup(React.createElement(Component)));link=dom.window.document.querySelector('a');assert.equal(link.getAttribute('href'),'/@alice');assert.equal(link.getAttribute('aria-label'),'View Alice profile');dom.window.close();
});
test('mobile toolbar store and message links carry their own names in rendered MUI markup',()=>{
 const mocks={
  './AccountMenu':{__esModule:true,default:()=>null},'./SearchToolbar':{__esModule:true,default:()=>null},'./AccountToolbar':{__esModule:true,default:()=>null},
  '@/hooks':{useAuthSession:()=>({user:{id:'user'},token:'token'})},'@/lib/swrHooks':{useUserStats:()=>({data:{totalUnreadMsg:0}})},
  'next/link':{__esModule:true,default:React.forwardRef(({href,children,...props},ref)=>React.createElement('a',{...props,ref,href},children))},
 };
 const Component=load('src/components/common/CustomToolbarActions.tsx',mocks);const dom=new JSDOM(renderToStaticMarkup(React.createElement(Component,{})));
 assert.equal(dom.window.document.querySelector('a[href="/store"].MuiIconButton-root').getAttribute('aria-label'),'Store');
 assert.equal(dom.window.document.querySelector('a[href="/messages"]').getAttribute('aria-label'),'Messages');dom.window.close();
});
test('mobile navigation has one adequately sized link per item without nested interactive controls',()=>{
 const link=({children,href,...props})=>React.createElement('a',{...props,href},children);
 const ui=({children,component,href,sx,...props})=>React.createElement(component||'div',{'aria-label':props['aria-label'],'aria-current':props['aria-current'],'aria-hidden':props['aria-hidden'],href,style:!Array.isArray(sx)&&sx?{minWidth:sx.minWidth,minHeight:sx.minHeight}:undefined},children);
 for(const file of ['src/components/common/AppBottomNav.tsx','src/components/games/AppBottomNav.tsx']){
  const Component=load(file,{'@mui/material/Box':{__esModule:true,default:ui},'@mui/material':{Container:ui,Stack:ui,Typography:ui},'next/link':{__esModule:true,default:link},'next/navigation':{usePathname:()=>'/' }});
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(Component)));const links=[...dom.window.document.querySelectorAll('a')];assert.ok(links.length>=4);
  for(const anchor of links){assert.ok(anchor.getAttribute('aria-label'));assert.equal(anchor.style.minWidth,'44px');assert.equal(anchor.style.minHeight,'56px');assert.equal(anchor.querySelector('button,a,[role="button"]'),null,'a navigation target must not contain another interactive target');}
  assert.equal(dom.window.document.querySelector('a[href="/"]').getAttribute('aria-current'),'page');dom.window.close();
 }
});
test('header logo emits intrinsic dimensions and reserves an adequate home-link touch target',()=>{
 const ui=({children,component,sx,...props})=>React.createElement(component||'div',null,children);
 const Component=load('src/app/(dashboard)/CustomLayout.tsx',{
  '@mui/material':{AppBar:ui,Box:ui,Divider:ui,Drawer:()=>null,IconButton:ui,List:ui,ListItemButton:ui,ListItemIcon:ui,ListItemText:ui,Toolbar:ui,Tooltip:ui,Typography:ui,useColorScheme:()=>({mode:'dark'}),useTheme:()=>({})},
  'next/link':{__esModule:true,default:({children,...props})=>React.createElement('a',props,children)},'next/navigation':{usePathname:()=>'/foryou'},'next-auth/react':{useSession:()=>({})},'@/config':{constant:{siteName:'Kwonnet'}},'@/providers/navigation':{getNavigationItems:()=>[]},'@/components/common/CustomThemeSwitcher':{__esModule:true,default:()=>null},
 });
 const dom=new JSDOM(renderToStaticMarkup(React.createElement(Component,{children:'Page'})));const image=dom.window.document.querySelector('img');assert.equal(image.getAttribute('width'),'25');assert.equal(image.getAttribute('height'),'25');const anchor=image.closest('a');assert.equal(anchor.style.minWidth,'44px');assert.equal(anchor.style.minHeight,'44px');dom.window.close();
});
