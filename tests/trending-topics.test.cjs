const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
function load(path, mocks) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
const api = load('src/lib/discover/index.ts', { '@/config': { apiUrl: 'https://api.example.invalid/api/v1' } });
test('sidebar falls back from an empty local collection to global trends without sending guest credentials', async () => {
  const oldFetch = global.fetch, requests = [];
  const topics = [{ trend: 'Solar', country: 'Global', posts: 2, mentions: 2, users: 1 }];
  global.fetch = async (url, options) => { requests.push([url, options]); return Response.json(requests.length === 1 ? [] : topics); };
  try {
    assert.deepEqual(await api.getSidebarTrends({ country: 'country-ng', limit: 3 }), topics);
    assert.equal(requests.length, 2);
    assert.match(requests[0][0], /country=country-ng/);
    assert.ok(!requests[1][0].includes('country='));
    assert.deepEqual(requests[0][1].headers, {});
    assert.equal(requests[0][1].cache, 'no-store');
  } finally { global.fetch = oldFetch; }
});
test('local results retain their country and token; legacy 404 is empty while real failures surface', async () => {
  const oldFetch = global.fetch; let requests = 0;
  global.fetch = async (url, options) => { requests++; assert.equal(options.headers.Authorization, 'Bearer test-token'); return Response.json([{ trend: 'Local', country: 'Nigeria' }]); };
  try {
    assert.equal((await api.getSidebarTrends({ country: 'country-ng', limit: 3 }, 'test-token'))[0].country, 'Nigeria');
    assert.equal(requests, 1);
    global.fetch = async () => new Response('Not found', { status: 404 });
    assert.deepEqual(await api.getTrendingTopics({ limit: 3 }), []);
    global.fetch = async () => new Response('database unavailable', { status: 500 });
    await assert.rejects(api.getSidebarTrends({ limit: 3 }), /Unable to load/);
    global.fetch = async () => Response.json('invalid');
    await assert.rejects(api.getTrendingTopics({ limit: 3 }), /Invalid trending/);
  } finally { global.fetch = oldFetch; }
});
test('server sidebar fetches public trends for guests and uses authenticated country IDs instead of ISO2', async () => {
  let session = null;
  const requests = [];
  const Sidebar = load('src/components/common/SidebarTrendServer.tsx', {
    '@/lib/server-session': { getServerSession: async () => session },
    '@/lib/discover': { getSidebarTrends: async (...args) => { requests.push(args); return [{ trend: 'Solar' }]; } },
    './SidebarTrendClient': { __esModule: true, default: () => null },
  }).default;
  assert.deepEqual((await Sidebar()).props.trends, [{ trend: 'Solar' }]);
  assert.deepEqual(requests[0], [{ country: undefined, limit: 3 }, undefined]);
  session = { user: { country: { id: 'country-ng', iso2: 'NG' }, accessToken: 'test-token' } };
  await Sidebar();
  assert.deepEqual(requests[1], [{ country: 'country-ng', limit: 3 }, 'test-token']);
});
