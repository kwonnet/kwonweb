const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {readFileSync} = require('node:fs');
const ts = require('typescript');
function client(ok = true) {
  const requests = [], module = {exports: {}};
  const context = {module, exports: module.exports, AbortSignal,
    require: id => ({'@/config': {apiUrl: 'https://api.test/api/v1'}, '@/config/axios': {axiosAPI: {}}, '@/utils': {}, react: {cache: fn => fn}}[id] ?? {}),
    fetch: async (url, options) => {requests.push({url,options}); return {ok, json: async () => ({subscribed: options.method === 'PUT' ? JSON.parse(options.body).enabled : true}), text: async () => 'Unavailable account'};},
  };
  vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/users/index.ts','utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText, context);
  return {api: module.exports, requests};
}
test('reads preferences with authentication and no shared caching', async () => {
  const c=client(); assert.equal((await c.api.getAuthorPostNotifications('author','token')).subscribed,true);
  assert.equal(c.requests[0].url,'https://api.test/api/v1/notifications/authors/author');
  assert.equal(c.requests[0].options.headers.Authorization,'Bearer token');
  assert.equal(c.requests[0].options.cache,'no-store');
});
test('uses an explicit idempotent desired state for subscribe and unsubscribe', async () => {
  const c=client();
  for (const enabled of [true,false]) {
    assert.equal((await c.api.setAuthorPostNotifications('author',enabled,'token')).subscribed,enabled);
    const request=c.requests.at(-1);
    assert.equal(request.options.method,'PUT');
    assert.deepEqual(JSON.parse(request.options.body),{enabled});
    assert.equal(request.options.headers.Authorization,'Bearer token');
  }
});
test('encodes the target account into a single route segment', async () => {
  const c=client(); await c.api.setAuthorPostNotifications('author/other',true,'token');
  assert.equal(c.requests[0].url,'https://api.test/api/v1/notifications/authors/author%2Fother');
});
test('propagates preference failures so the bell cannot report a false success', async () => {
  const c=client(false);
  await assert.rejects(c.api.getAuthorPostNotifications('author','token'),/Unable to load/);
  await assert.rejects(c.api.setAuthorPostNotifications('author',true,'token'),/Unavailable account/);
});
