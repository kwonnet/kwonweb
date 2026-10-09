const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const ts = require('typescript');
function load(path, dependencies = {}) {
  const module = {exports: {}};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX}}).outputText;
  new Function('require', 'module', 'exports', code)(name => name in dependencies ? dependencies[name] : require(name), module, module.exports);
  return module.exports;
}
const {updateProfileCache} = load('src/utils/profile-cache.ts');
const saved = {id: 'u', username: 'new', name: 'New', avatar: 'new.png', countryId: 'ng', bio: 'Bio', banner: null};
const country = {id: 'ng', iso3: 'NGA', name: 'Nigeria'};
function refresh(user, calls, caches) {
  return load('src/hooks/useRefreshProfileIdentity.ts', {
    'next-auth/react': {useSession: () => ({update: async data => {calls.push(['update', data]); return {user};}})},
    swr: {useSWRConfig: () => ({mutate: async (filter, mapper, options) => {
      calls.push(['mutate', options]);
      if (mapper) for (const [key, value] of caches) if (filter(key)) caches.set(key, mapper(value));
    }})},
    'next/navigation': {useRouter: () => ({refresh: () => calls.push(['router'])})},
    '@/lib/account-actions': {rememberCurrentAccount: async () => calls.push(['remember'])},
    '@/utils/profile-cache': {updateProfileCache},
  }).default();
}
test('refreshes authoritative session, all cached identity records, saved account and server layout after profile save', async () => {
  const calls = [], other = {id: 'other', username: 'other', country: {id: 'us'}};
  const caches = new Map([
    ['feed', {posts: [{author: {id: 'u', username: 'old', avatar: 'old.png', country: {id: 'us'}, countryId: 'us'}, actions: {liked: true}}]}],
    [['/api/accounts', 'u'], [{id: 'u', username: 'old', name: 'Old', avatar: 'old.png'}, other]],
  ]);
  await refresh({...saved, country, accessToken: 'private'}, calls, caches)(saved);
  const author = caches.get('feed').posts[0].author;
  assert.equal(author.username, 'new'); assert.equal(author.avatar, 'new.png'); assert.equal(author.country.iso3, 'NGA');
  assert.equal(author.countryId, 'ng'); assert.equal(caches.get('feed').posts[0].actions.liked, true);
  const accounts = [...caches.values()][1]; assert.equal(accounts[0].username, 'new'); assert.equal(accounts[1], other);
  assert.deepEqual(calls.map(call => call[0]), ['update', 'mutate', 'remember', 'mutate', 'router']);
  assert.deepEqual(calls[0][1], {refreshIdentity: true});
  assert.equal(JSON.stringify([...caches.values()]).includes('private'), false);
});
test('does not remember stale auth fallback or overwrite a different active account after a committed save', async () => {
  for (const changed of [{username: 'old'}, {country}, {id: 'switched'}, {avatar: 'old.png'}]) {
    const calls = [];
    const user = {...saved, country, ...changed};
    if (changed.country) user.country = {id: 'old-country'};
    await assert.rejects(refresh(user, calls, new Map())(saved), /Profile saved, but account refresh failed/);
    assert.deepEqual(calls.map(call => call[0]), ['update']);
  }
});

test('session broadcasts synchronize another tab and country currency without sweeping caches on token renewal', async () => {
  const React = require('react');
  const {JSDOM} = require('jsdom');
  const dom = new JSDOM('<div id="root"></div>');
  const previous = {window: global.window, document: global.document, act: global.IS_REACT_ACT_ENVIRONMENT};
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const {createRoot} = require('react-dom/client');
  let user = {id: 'u', name: 'Old', username: 'old', avatar: 'old.png', country: {id: 'us', iso3: 'USA'}, accessToken: 'one'};
  let cached = [{...user}], patches = 0, refreshes = 0;
  const passthrough = ({children}) => children;
  const Provider = load('src/providers/NextjsAppProvider.tsx', {
    '@mui/material': {CssBaseline: () => null, ThemeProvider: passthrough},
    '@mui/material/InitColorSchemeScript': {default: () => null, __esModule: true},
    './NotificationsProvider': {NotificationsProvider: passthrough},
    './PwaProvider': {__esModule: true, default: passthrough},
    './theme': {},
    'next-auth/react': {useSession: () => ({data: {user}})},
    swr: {SWRConfig: passthrough, unstable_serialize: key => JSON.stringify(key), useSWRConfig: () => ({cache: {get: key => key === JSON.stringify(['profile', 'u']) ? {data: cached} : key === JSON.stringify(['account-settings']) ? {data: {username: 'old', hasPassword: false}} : {data: undefined}}, mutate: async (filter, mapper) => {
      assert.equal(filter(['pending-settings']), false, 'OAuth identity updates must not cancel pending settings requests');
      assert.equal(filter(['account-settings']), false, 'unrelated account data must not be mutated');
      if (filter(['profile', 'u'])) {patches++; cached = mapper(cached);}
    }})},
    'next/navigation': {useRouter: () => ({refresh: () => refreshes++})},
    '@/utils/profile-cache': {updateProfileCache},
  }).default;
  const root = createRoot(document.getElementById('root'));
  const render = () => React.act(async () => root.render(React.createElement(Provider, null, 'App')));
  try {
    await render(); const initial = patches;
    user = {...user, accessToken: 'renewed'}; await render();
    assert.equal(patches, initial); assert.equal(refreshes, 0);
    user = {...user, username: 'new', avatar: 'new.png', country}; await render();
    assert.equal(cached[0].username, 'new'); assert.equal(cached[0].country.iso3, 'NGA');
    assert.equal(cached[0].country.iso3 === 'NGA' ? 'NGN' : 'USD', 'NGN');
    assert.equal(patches, initial + 1); assert.equal(refreshes, 1);
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    global.window = previous.window; global.document = previous.document; global.IS_REACT_ACT_ENVIRONMENT = previous.act;
  }
});
