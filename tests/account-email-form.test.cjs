const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {JSDOM}=require('jsdom');
for(const mode of ['verify-email','reset-password'])test(`${mode} keeps the link secret out of the URL and waits for user confirmation`,async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:`https://kwonnet.test/auth/${mode}#token=opaque-token`});
 global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const fields={},calls=[];let submit;
 const ui=({children})=>React.createElement('div',null,children);
 const mocks={
  '@mui/material':{Alert:ui,Container:ui,Paper:ui,Typography:ui,Stack:props=>{submit=props.onSubmit;return React.createElement('form',null,props.children);},Button:({children})=>React.createElement('button',null,children),TextField:props=>{fields[props.label]=props;return React.createElement('input',{value:props.value,readOnly:true});}},
  'next/link':{__esModule:true,default:ui},
  '@/lib/auth':{requestAccountEmail:async(...args)=>{calls.push(args);return {message:'Action completed. Sign in now.'};}},
 };
 const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync('src/components/auth/AccountEmailForm.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(id=>id in mocks?mocks[id]:require(id),module,module.exports);
 const root=require('react-dom/client').createRoot(document.getElementById('root'));
 try{
  await React.act(async()=>root.render(React.createElement(module.exports.default,{mode})));
  assert.equal(window.location.hash,'');assert.equal(calls.length,0);
  if(mode==='reset-password'){
   await React.act(async()=>{fields['New password'].onChange({target:{value:'new-password'}});fields['Confirm password'].onChange({target:{value:'wrong-password'}});});
   await React.act(async()=>submit({preventDefault(){}}));assert.equal(calls.length,0);assert.match(document.body.textContent,/Passwords do not match/);
   await React.act(async()=>fields['Confirm password'].onChange({target:{value:'new-password'}}));
  }
  await React.act(async()=>submit({preventDefault(){}}));
  assert.deepEqual(calls,[[mode,{token:'opaque-token',...(mode==='reset-password'?{newPassword:'new-password'}:{})}]]);
  assert.match(document.body.textContent,/Action completed/);assert.match(document.body.textContent,/Back to sign in/);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
