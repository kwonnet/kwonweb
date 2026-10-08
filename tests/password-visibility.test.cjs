const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const ts=require('typescript');
const React=require('react');
const {JSDOM}=require('jsdom');

test('MUI password fields toggle independently without submitting, losing focus or changing values and constraints',async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'https://kwonnet.test'});
  global.window=dom.window;global.document=dom.window.document;global.HTMLElement=dom.window.HTMLElement;global.IS_REACT_ACT_ENVIRONMENT=true;
  const {createRoot}=require('react-dom/client');
  const module={exports:{}};
  const source=ts.transpileModule(readFileSync('src/components/common/PasswordTextField.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  new Function('require','module','exports',source)(require,module,module.exports);
  const PasswordTextField=module.exports.default;
  let submissions=0;
  const root=createRoot(document.getElementById('root'));
  try {
    await React.act(async()=>root.render(React.createElement('form',{onSubmit:event=>{event.preventDefault();submissions++;}},
      React.createElement(PasswordTextField,{label:'Messaging passphrase',value:'test-passphrase',onChange:()=>{},autoComplete:'new-password',slotProps:{htmlInput:{minLength:12,maxLength:64},input:()=>({endAdornment:React.createElement('span',null,'suffix')})}}),
      React.createElement(PasswordTextField,{label:'Confirm passphrase',value:'test-passphrase',onChange:()=>{}}),
      React.createElement(PasswordTextField,{label:'Disabled password',value:'hidden',disabled:true,onChange:()=>{}}),
    )));
    const inputs=[...document.querySelectorAll('input')];
    assert.deepEqual(inputs.map(input=>input.type),['password','password','password']);
    assert.equal(inputs[0].minLength,12);assert.equal(inputs[0].maxLength,64);assert.equal(inputs[0].autocomplete,'new-password');
    assert.match(document.body.textContent,/suffix/,'existing adornments are retained');
    const show=document.querySelector('button[aria-label="Show messaging passphrase"]');
    await React.act(async()=>inputs[0].focus());
    await React.act(async()=>assert.equal(show.dispatchEvent(new dom.window.MouseEvent('mousedown',{bubbles:true,cancelable:true})),false));
    await React.act(async()=>show.click());
    assert.equal(inputs[0].type,'text');assert.equal(inputs[1].type,'password');assert.equal(inputs[0].value,'test-passphrase');assert.equal(document.activeElement,inputs[0]);
    const hide=document.querySelector('button[aria-label="Hide messaging passphrase"]');assert.equal(hide.getAttribute('aria-pressed'),'true');
    await React.act(async()=>hide.click());assert.equal(inputs[0].type,'password');assert.equal(submissions,0);
    assert.equal(document.querySelector('button[aria-label="Show disabled password"]').disabled,true);
  } finally {await React.act(async()=>root.unmount());dom.window.close();}
});
