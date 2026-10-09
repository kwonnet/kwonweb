const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');
const { createRoot } = require('react-dom/client');

test('authentication preserves input when switching modes and sends the correct credentials and safe callback', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://kwonnet.com/?auth=signup&refId=friend&callbackUrl=%2Fwallet' });
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const fields = {}, calls = [];
  let form, resolveSignIn;
  const element = ({ children }) => React.createElement('div', null, children);
  const mocks = {
    '@/config/public-env': {publicEnv:()=> 'true'},
    "next/link": {__esModule: true, default: ({children, href}) => React.createElement("a", {href}, children)},
    '@/lib/account-actions': { rememberCurrentAccount: async () => {} },
    '@mui/material': {
      Box: props => { form = props; return React.createElement('form', { onSubmit: props.onSubmit }, props.children); },
      Stack: element, Typography: element, Alert: element,
      TextField: props => { fields[props.name] = props; return React.createElement('input', { name: props.name, value: props.value, readOnly: true }); },
      Button: ({ loading, variant, size, ...props }) => React.createElement('button', props),
    },
    '@/lib/auth': {registerCredentialAccount: (...args) => {calls.push(['register',...args]); return new Promise(resolve => {resolveSignIn = resolve;}).then(result => {if(result.error)throw new Error(result.code);return result;});},requestAccountEmail:async()=>({message:'Check email'})},
    'next-auth/react': { signIn: (...args) => { calls.push(args); return new Promise(resolve => { resolveSignIn = resolve; }); } },
  };
  function load(path) {
    mocks['@/components/common/PasswordTextField'] = {__esModule: true, default: mocks['@mui/material'].TextField};
  const module = { exports: {} };
    const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    new Function('require', 'module', 'exports', code)(name => {
      if (name in mocks) return mocks[name];
      if (name === '@/lib/auth-redirect') return load('src/lib/auth-redirect.ts');
      return require(name);
    }, module, module.exports);
    return module.exports;
  }
  const AuthForm = load('src/components/auth/AuthForm.tsx').default;
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(AuthForm)));
    assert.equal(document.querySelector('input[name="name"]'), null, 'login is the default view');
    assert.match(document.body.textContent, /Welcome back/);
    assert.doesNotMatch(document.body.textContent, /Resend verification email/);
    await React.act(async () => [...document.querySelectorAll('button')].find(b => /New to Kwonnet|Already have an account/.test(b.textContent)).click());
    await React.act(async () => {
      fields.name.onChange({ target: { value: 'Ada' } });
      fields.email.onChange({ target: { value: 'ada@example.invalid' } });
      fields.password.onChange({ target: { value: 'test-only-password' } });
    });
    let pending;
    await React.act(async () => { pending = form.onSubmit({ preventDefault() {} }); });
    assert.deepEqual(calls[0], ['register', { email: 'ada@example.invalid', password: 'test-only-password', name: 'Ada', refId: 'friend' }]);
    await React.act(async () => form.onSubmit({ preventDefault() {} }));
    assert.equal(calls.length, 1, 'pending submissions must not be duplicated');
    await React.act(async () => { resolveSignIn({ error: 'CredentialsSignin', code: 'Account already exists' }); await pending; });
    assert.match(document.body.textContent, /Account already exists/);
    await React.act(async () => [...document.querySelectorAll('button')].find(b => /New to Kwonnet|Already have an account/.test(b.textContent)).click());
    assert.equal(fields.email.value, 'ada@example.invalid');
    assert.equal(fields.password.value, 'test-only-password');
    assert.equal(document.querySelector('input[name="name"]'), null);
    assert.doesNotMatch(document.body.textContent, /Account already exists/);
    dom.reconfigure({ url: 'https://kwonnet.com/?callbackUrl=https%3A%2F%2Fevil.invalid' });
    await React.act(async () => { pending = form.onSubmit({ preventDefault() {} }); });
    assert.deepEqual(calls[1], ['credentials-in', { email: 'ada@example.invalid', password: 'test-only-password', redirectTo: 'https://kwonnet.com/', redirect: false }]);
    await React.act(async () => { resolveSignIn(undefined); await pending; });
    assert.match(document.body.textContent, /Unable to sign in/);
    assert.equal(document.querySelector('button[type="submit"]').disabled, false, 'failed authentication can be retried');
    assert.doesNotMatch(document.body.textContent, /Resend verification email/);
    await React.act(async () => {pending = form.onSubmit({preventDefault() {}});});
    await React.act(async () => {resolveSignIn({error: 'CredentialsSignin', code: '"Verify your email before signing in. Check your inbox or resend the verification email."'});await pending;});
    assert.match(document.body.textContent, /Resend verification email/);
    await React.act(async () => fields.email.onChange({target: {value: 'another@example.invalid'}}));
    assert.doesNotMatch(document.body.textContent, /Resend verification email/);
    await React.act(async () => [...document.querySelectorAll('button')].find(b => /New to Kwonnet/.test(b.textContent)).click());
    await React.act(async () => {pending = form.onSubmit({preventDefault() {}});});
    await React.act(async () => {resolveSignIn({verificationRequired:true,message:'Check your email for verification'});await pending;});
    assert.equal(calls[3][0], 'register');assert.equal(calls.length,4);
    assert.match(document.body.textContent,/Check your email for verification/);
    assert.equal(fields.password.value,'');assert.equal(document.querySelector('input[name="name"]'),null);
    assert.doesNotMatch(document.body.textContent, /Resend verification email/);

  } finally { await React.act(async () => root.unmount()); dom.window.close(); }
});

test('configured Google authentication starts OAuth with the safe application redirect', async () => {
  const dom = new JSDOM('<div id="root"></div>', {url: 'https://kwonnet.com/?callbackUrl=https://evil.invalid'});
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const calls = [];
  const element = ({children}) => React.createElement('div', null, children);
  const mocks = {
    '@/config/public-env': {publicEnv:()=> 'true'},
    "next/link": {__esModule: true, default: ({children, href}) => React.createElement("a", {href}, children)},
    '@mui/material': {Box: element, Stack: element, Typography: element, Alert: element,
      TextField: () => null, Button: ({children, onClick, disabled, type}) => React.createElement('button', {onClick, disabled, type}, children)},
    '@/lib/auth': {},
    'next-auth/react': {getProviders: async () => ({google: {id: 'google'}}), signIn: async (...args) => {calls.push(args);}},
  };
  function load(file) {
    mocks['@/components/common/PasswordTextField'] = {__esModule: true, default: mocks['@mui/material'].TextField};
  const module = {exports: {}};
    const code = ts.transpileModule(readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
    new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : name === '@/lib/auth-redirect' ? load('src/lib/auth-redirect.ts') : require(name), module, module.exports);
    return module.exports;
  }
  const Form = load('src/components/auth/AuthForm.tsx').default;
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(Form)));
    const google = [...document.querySelectorAll('button')].find(button => button.textContent === 'Continue with Google');
    assert.ok(google);
    await React.act(async () => google.click());
    assert.deepEqual(calls, [['google', {redirectTo: 'https://kwonnet.com/'}]]);
  } finally {await React.act(async () => root.unmount()); dom.window.close();}
});

test('closed registration renders sign-in even for signup links and preserves credentials and Google login',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://kwonnet.com/?auth=signup'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 let form;const fields={},calls=[];const element=({children})=>React.createElement('div',null,children);
 const mocks={
  '@/config/public-env':{publicEnv:()=>undefined},'@/lib/auth-redirect':{safeAuthRedirect:()=> '/'},
  '@/lib/auth':{registerCredentialAccount:()=>{throw new Error('Registration must not run');},requestAccountEmail:async()=>({message:'Sent'})},
  '@/components/common/PasswordTextField':{__esModule:true,default:props=>{fields.password=props;return React.createElement('input',{name:'password',readOnly:true,value:props.value});}},
  'next-auth/react':{getProviders:async()=>({google:{}}),signIn:async(...args)=>{calls.push(args);return {error:'CredentialsSignin',code:'Invalid credentials'};}},
  'next/link':{__esModule:true,default:({children,href})=>React.createElement('a',{href},children)},
  '@mui/material':{Box:props=>{form=props;return React.createElement('form',{onSubmit:props.onSubmit},props.children);},Stack:element,Typography:element,Alert:element,TextField:props=>{fields[props.name]=props;return React.createElement('input',{name:props.name,value:props.value,readOnly:true});},Button:({loading,variant,size,component,...props})=>React.createElement('button',props)},
 };
 const module={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync('src/components/auth/AuthForm.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(name=>name in mocks?mocks[name]:require(name),module,module.exports);
 const root=createRoot(document.getElementById('root'));
 try{
  await React.act(async()=>root.render(React.createElement(module.exports.default,{initialMode:'signup'})));
  assert.match(document.body.textContent,/registrations are temporarily disabled/);assert.match(document.body.textContent,/Log in/);assert.doesNotMatch(document.body.textContent,/Create account|New to Kwonnet/);assert.equal(document.querySelector('[name="name"]'),null);
  await React.act(async()=>{fields.email.onChange({target:{value:'existing@test.invalid'}});fields.password.onChange({target:{value:'existing-password'}});});
  await React.act(async()=>form.onSubmit({preventDefault(){}}));assert.equal(calls[0][0],'credentials-in');
  await React.act(async()=>[...document.querySelectorAll('button')].find(button=>button.textContent==='Continue with Google').click());assert.equal(calls[1][0],'google');
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
