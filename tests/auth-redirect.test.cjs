const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const compiled = ts.transpileModule(readFileSync('src/lib/auth-redirect.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText;
function load(env = {}) {
  const context = { exports: {}, process: { env }, URL };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

test('Docker request redirects to the public login with a relative callback', () => {
  const { signInRedirect } = load({ NEXT_PUBLIC_APP_URL: 'https://kwonnet.com' });
  const result = new URL(signInRedirect('https://0.0.0.0:3000/discover?tab=following'));
  assert.equal(result.origin, 'https://kwonnet.com');
  assert.equal(result.pathname, '/auth/signin');
  assert.equal(result.searchParams.get('callbackUrl'), '/discover?tab=following');
});

test('NEXT_PUBLIC_APP_URL is the single runtime source even with stale auth settings', () => {
  const env = { AUTH_URL: 'https://old.example', NEXT_PUBLIC_APP_URL: 'https://kwonnet.com' };
  const { authOrigin } = load(env);
  assert.equal(authOrigin('http://0.0.0.0:3000'), 'https://kwonnet.com');
  env.NEXT_PUBLIC_APP_URL = 'https://new.example';
  assert.equal(authOrigin('http://0.0.0.0:3000'), 'https://new.example');
  assert.equal(load().authOrigin('http://localhost:3000/foo'), 'http://localhost:3000');
});

test('Auth.js internal URL is derived from the public setting', () => {
  const env = { NEXT_PUBLIC_APP_URL: 'https://kwonnet.com/' };
  const { configureAuthOrigin } = load(env);
  configureAuthOrigin();
  assert.equal(env.AUTH_URL, 'https://kwonnet.com');
  env.AUTH_URL = 'http://0.0.0.0:3000';
  configureAuthOrigin();
  assert.equal(env.AUTH_URL, 'https://kwonnet.com');
});

test('valid same-origin callbacks preserve paths and queries', () => {
  const { safeAuthRedirect } = load();
  for (const input of ['/discover?tab=following', 'https://kwonnet.com/discover?tab=following']) {
    assert.equal(safeAuthRedirect(input, 'https://kwonnet.com'), 'https://kwonnet.com/discover?tab=following');
  }
});

test('old Docker URLs, external URLs, invalid URLs and login loops go home', () => {
  const { safeAuthRedirect } = load();
  for (const input of [null, 'https://0.0.0.0:3000/', '//evil.example', '/\\evil.example',
    'https://evil.example', 'javascript:alert(1)', 'https://[', '/auth/signin', '/?refId=123']) {
    assert.equal(safeAuthRedirect(input, 'https://kwonnet.com'), 'https://kwonnet.com/');
  }
});
