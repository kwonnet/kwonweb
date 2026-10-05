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
    "next/link": {__esModule: true, default: ({children, href}) => React.createElement("a", {href}, children)},
    '@/lib/account-actions': { rememberCurrentAccount: async () => {} },
    '@mui/material': {
      Box: props => { form = props; return React.createElement('form', { onSubmit: props.onSubmit }, props.children); },
      Stack: element, Typography: element, Alert: element,
      TextField: props => { fields[props.name] = props; return React.createElement('input', { name: props.name, value: props.value, readOnly: true }); },
      Button: ({ loading, variant, size, ...props }) => React.createElement('button', props),
    },
    'next-auth/react': { signIn: (...args) => { calls.push(args); return new Promise(resolve => { resolveSignIn = resolve; }); } },
  };
  function load(path) {
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
    await React.act(async () => document.querySelector('button[type="button"]').click());
    await React.act(async () => {
      fields.name.onChange({ target: { value: 'Ada' } });
      fields.email.onChange({ target: { value: 'ada@example.invalid' } });
      fields.password.onChange({ target: { value: 'test-only-password' } });
    });
    let pending;
    await React.act(async () => { pending = form.onSubmit({ preventDefault() {} }); });
    assert.deepEqual(calls[0], ['credentials-up', { email: 'ada@example.invalid', password: 'test-only-password', name: 'Ada', refId: 'friend', redirectTo: 'https://kwonnet.com/wallet', redirect: false }]);
    await React.act(async () => form.onSubmit({ preventDefault() {} }));
    assert.equal(calls.length, 1, 'pending submissions must not be duplicated');
    await React.act(async () => { resolveSignIn({ error: 'CredentialsSignin', code: 'Account already exists' }); await pending; });
    assert.match(document.body.textContent, /Account already exists/);
    await React.act(async () => document.querySelector('button[type="button"]').click());
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
  } finally { await React.act(async () => root.unmount()); dom.window.close(); }
});

test('configured Google authentication starts OAuth with the safe application redirect', async () => {
  const dom = new JSDOM('<div id="root"></div>', {url: 'https://kwonnet.com/?callbackUrl=https://evil.invalid'});
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const calls = [];
  const element = ({children}) => React.createElement('div', null, children);
  const mocks = {
    "next/link": {__esModule: true, default: ({children, href}) => React.createElement("a", {href}, children)},
    '@mui/material': {Box: element, Stack: element, Typography: element, Alert: element,
      TextField: () => null, Button: ({children, onClick, disabled, type}) => React.createElement('button', {onClick, disabled, type}, children)},
    'next-auth/react': {getProviders: async () => ({google: {id: 'google'}}), signIn: async (...args) => {calls.push(args);}},
  };
  function load(file) {
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
