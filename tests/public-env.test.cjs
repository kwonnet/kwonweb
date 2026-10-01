const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const source = readFileSync('src/config/public-env.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText;
function load(env, window) {
  const context = { exports: {}, process: { env } };
  if (window) context.window = window;
  vm.runInNewContext(compiled, context);
  return context.exports;
}
test('server reads the current runtime environment', () => {
  const env = { NEXT_PUBLIC_API_URL: 'https://first.example' };
  const config = load(env);
  assert.equal(config.publicEnv('NEXT_PUBLIC_API_URL'), env.NEXT_PUBLIC_API_URL);
  env.NEXT_PUBLIC_API_URL = 'https://second.example';
  assert.equal(config.publicEnv('NEXT_PUBLIC_API_URL'), env.NEXT_PUBLIC_API_URL);
});
test('browser reads injected runtime values rather than build values', () => {
  const config = load({ NEXT_PUBLIC_API_URL: 'https://build.example' }, {
    __KWONNET_PUBLIC_ENV__: { NEXT_PUBLIC_API_URL: 'https://runtime.example' },
  });
  assert.equal(config.publicEnv('NEXT_PUBLIC_API_URL'), 'https://runtime.example');
  assert.equal(config.publicEnv('NEXT_PUBLIC_APP_LOGO'), undefined);
});
test('inline configuration escapes HTML and excludes secrets and unknown public keys', () => {
  const value = '</script><script>alert(1)</script>\u2028\u2029';
  const script = load({ NEXT_PUBLIC_APP_LOGO: value, AUTH_SECRET: 'private-auth',
    BUNNY_STREAM_API_KEY: 'private-bunny', NEXT_PUBLIC_UNKNOWN: 'not-allowed' }).publicEnvScript();
  assert.ok(!script.includes('<'));
  assert.ok(!script.includes('private-auth'));
  assert.ok(!script.includes('private-bunny'));
  assert.ok(!script.includes('not-allowed'));
  const browser = { window: {} };
  vm.runInNewContext(script, browser);
  assert.equal(browser.window.__KWONNET_PUBLIC_ENV__.NEXT_PUBLIC_APP_LOGO, value);
});
