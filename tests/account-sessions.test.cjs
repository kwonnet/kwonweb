const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const { encode } = require('next-auth/jwt');

function modules(overrides = {}) {
  const cache = {};
  function load(path) {
    if (cache[path]) return cache[path];
    const module = { exports: {} };
    const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    new Function('require', 'module', 'exports', code)(name => {
      if (name in overrides) return overrides[name];
      if (name === '@/utils/pushClient') return {clearBrowserPushSubscription: async () => {}};
      if (name === 'server-only') return {};
      if (name.startsWith('@/lib/')) return load(`src/lib/${name.slice(6)}.ts`);
      if (name === './account-session-policy' || name === './lib/account-session-policy') return load('src/lib/account-session-policy.ts');
      if (name === './lib/saved-accounts') return load('src/lib/saved-accounts.ts');
      if (name === './lib/auth-request-context') return load('src/lib/auth-request-context.ts');
      if (name === './lib/auth-redirect') return load('src/lib/auth-redirect.ts');
      if (name === './lib/auth-refresh-policy') return load('src/lib/auth-refresh-policy.ts');
      if (name === './config' || name === '@/config') return { apiUrl: 'https://api.example.invalid/api/v1' };
      if (name === './schema') return {};
      if (name === './types/user') return {};
      return require(name);
    }, module, module.exports);
    cache[path] = module.exports;
    return module.exports;
  }
  return load;
}
const policy = modules()('src/lib/account-session-policy.ts');

test('logout reloads guest home without broadcasting a session change into the mounted dashboard', async () => {
  const oldFetch = global.fetch, oldWindow = global.window;
  const client = { accessToken: 'current-token' };
  let navigations = 0;
  const actions = modules({
    'next-auth/react': { signOut: () => { throw new Error('must not broadcast a client logout'); } },
    '@/config/axios': { axiosAPI: client },
    '@/config': { apiUrl: 'https://api.example.invalid/api/v1' },
  })('src/lib/account-actions.ts');
  global.window = { location: { replace: url => {
    assert.equal(url, '/');
    assert.equal(client.accessToken, undefined);
    navigations++;
  } } };
  try {
    for (const backendFails of [false, true]) {
      client.accessToken = 'current-token';
      const requests = [];
      global.fetch = async (url, options) => {
        requests.push(url);
        assert.equal(client.accessToken, 'current-token', 'keep the mounted dashboard stable until navigation');
        if (url === '/api/accounts') {
          assert.equal(JSON.parse(options.body).action, 'logout');
          return new Response('{}', { status: 200 });
        }
        assert.equal(options.credentials, 'include');
        if (backendFails) throw new Error('backend unavailable');
        return new Response('{}');
      };
      await actions.logoutCurrentAccount();
      assert.deepEqual(requests, ['/api/accounts', 'https://api.example.invalid/api/v1/auth/logout']);
    }
    assert.equal(navigations, 2, 'backend cleanup failure must still reload into guest mode');
    client.accessToken = 'current-token';
    global.fetch = async () => new Response('{}', { status: 500 });
    await assert.rejects(actions.logoutCurrentAccount(), /Unable to sign out/);
    assert.equal(client.accessToken, 'current-token');
    assert.equal(navigations, 2, 'do not claim logout when local cookie revocation fails');
  } finally {
    global.fetch = oldFetch;
    if (oldWindow === undefined) delete global.window; else global.window = oldWindow;
  }
});

test('logout invalidates the original login across later token refreshes, while explicit fresh login works', () => {
  const token = { iat: 10, sessionIssuedAt: 10000 };
  assert.equal(policy.sessionWasLoggedOut(token, 11000), true);
  assert.equal(policy.sessionWasLoggedOut({ ...token, iat: 12 }, 11000), true, 'a late refresh must not revive the old login');
  assert.equal(policy.sessionWasLoggedOut({ sessionIssuedAt: 12000 }, 11000), false);
  assert.equal(policy.sessionWasLoggedOut({ iat: 10 }, 11000), true, 'legacy sessions are covered');
  assert.equal(policy.logoutTime('kwonnet.logout-at=garbage'), 0);
  assert.equal(policy.logoutTime(`kwonnet.logout-at=${Date.now() + 10000}`), 0);
});

test('account cookies are encrypted, tamper resistant and disclose only safe profile metadata', async () => {
  process.env.AUTH_SECRET = 'local-tests-only-encryption-secret';
  const vault = modules()('src/lib/saved-accounts.ts');
  const account = { id: 'ada', name: 'Ada', username: 'ada', accessToken: 'private-token', savedAt: Date.now() };
  const name = vault.accountCookieName(account.id, true);
  const value = await vault.encodeAccount(account, true);
  assert.equal(value.includes('private-token'), false);
  assert.deepEqual(await vault.readSavedAccounts({ getAll: () => [{ name, value }] }, true), [account]);
  assert.deepEqual(await vault.readSavedAccounts({ getAll: () => [{ name, value: value.slice(0, -8) + 'tampered' }] }, true), []);
  assert.deepEqual(await vault.readSavedAccounts({ getAll: () => [{ name: vault.accountCookieName('other', true), value }] }, true), []);
  assert.deepEqual(await vault.readSavedAccounts({ getAll: () => [{ name, value }] }, false), []);
  assert.equal('accessToken' in vault.accountProfile(account), false);
});

test('logout clears chunked and legacy cookies, removes only the selected saved account, and works without backend refresh', async () => {
  process.env.AUTH_SECRET = 'local-tests-only-encryption-secret';
  process.env.NEXT_PUBLIC_APP_URL = 'https://kwonnet.test';
  const load = modules({ '@/auth': { auth: async () => { throw new Error('backend unavailable'); } } });
  const vault = load('src/lib/saved-accounts.ts');
  const route = load('src/app/api/accounts/route.ts');
  const makeAccount = id => ({ id, name: id, username: id, accessToken: `${id}-token`, savedAt: Date.now() });
  const aName = vault.accountCookieName('ada', true), bName = vault.accountCookieName('ben', true);
  const generation = '00000000-0000-4000-8000-000000000001';
  const sessionName = `__Secure-authjs.session-token-${generation}`;
  const jwt = await encode({ token: { user: { id: 'ada' }, sessionIssuedAt: Date.now() }, secret: process.env.AUTH_SECRET, salt: sessionName });
  const request = new NextRequest('https://kwonnet.test/api/accounts', { method: 'POST', headers: { origin: 'https://kwonnet.test', 'content-type': 'application/json', cookie: `kwonnet.active-session=${generation}; ${sessionName}=${jwt}; authjs.session-token.0=legacy; ${aName}=${await vault.encodeAccount(makeAccount('ada'), true)}; ${bName}=${await vault.encodeAccount(makeAccount('ben'), true)}` }, body: JSON.stringify({ action: 'logout' }) });
  const response = await route.POST(request);
  assert.equal(response.status, 200);
  const cookies = response.headers.getSetCookie();
  assert.ok(cookies.some(cookie => cookie.startsWith(`${sessionName}=`) && cookie.includes('Max-Age=0')), 'logout removes the active generation cookie');
  assert.ok(cookies.some(cookie => cookie.startsWith('kwonnet.logout-at=') && cookie.includes('HttpOnly') && cookie.includes('Secure')));
  assert.ok(cookies.some(cookie => cookie.startsWith(`${aName}=`) && cookie.includes('Max-Age=0')));
  assert.ok(!cookies.some(cookie => cookie.startsWith(`${bName}=`)), 'other accounts require explicit selection and remain saved');
  assert.ok(cookies.some(cookie => cookie.startsWith('authjs.session-token.0=') && cookie.includes('Max-Age=0')));
  assert.ok(cookies.some(cookie => cookie.startsWith('__Secure-next-auth.session-token=') && cookie.includes('Domain=kwonnet.test')));
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const rejected = await route.POST(new NextRequest('https://kwonnet.test/api/accounts', { method: 'POST', headers: { origin: 'https://attacker.test', 'content-type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) }));
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.getSetCookie().length, 0);
});

test('saved account list never exposes tokens and remembering another account is bounded', async () => {
  process.env.AUTH_SECRET = 'local-tests-only-encryption-secret';
  process.env.NEXT_PUBLIC_APP_URL = 'https://kwonnet.test';
  const user = { id: 'new', name: 'New', username: 'new', accessToken: 'new-private-token' };
  const load = modules({ '@/auth': { auth: async () => ({ user }) } });
  const vault = load('src/lib/saved-accounts.ts'), route = load('src/app/api/accounts/route.ts');
  const cookies = [];
  for (let i = 0; i < 5; i++) {
    const account = { id: `a${i}`, name: `Account ${i}`, username: `a${i}`, accessToken: `secret${i}`, savedAt: i };
    cookies.push(`${vault.accountCookieName(account.id, true)}=${await vault.encodeAccount(account, true)}`);
  }
  const headers = { origin: 'https://kwonnet.test', 'content-type': 'application/json', cookie: cookies.join('; ') };
  const list = await route.GET(new NextRequest('https://kwonnet.test/api/accounts', { headers }));
  assert.equal((await list.clone().json()).length, 5);
  assert.equal((await list.text()).includes('secret'), false);
  const remembered = await route.POST(new NextRequest('https://kwonnet.test/api/accounts', { method: 'POST', headers, body: JSON.stringify({ action: 'remember' }) }));
  assert.equal(remembered.status, 200);
  assert.ok(remembered.headers.getSetCookie().some(cookie => cookie.startsWith(vault.accountCookieName('a0', true) + '=') && cookie.includes('Max-Age=0')));
  assert.ok(remembered.headers.getSetCookie().some(cookie => cookie.startsWith(vault.accountCookieName('new', true) + '=') && cookie.includes('HttpOnly')));
});

test('Auth.js rejects logged-out and superseded sessions before refresh; a password login starts a new identity', async () => {
  let configuration;
  let header = `kwonnet.logout-at=${Date.now() - 500}; kwonnet.active-session=new-generation`;
  const load = modules({
    'next-auth': { __esModule: true, default: config => { configuration = config; return { handlers: {} }; }, CredentialsSignin: class extends Error {} },
    'next-auth/providers/credentials': { __esModule: true, default: provider => provider },
    'next/headers': { headers: async () => new Headers({ cookie: header }) },
  });
  load('src/auth.ts');
  const config = await configuration();
  const oldFetch = global.fetch;
  let requests = 0;
  global.fetch = async () => { requests++; throw new Error('must not refresh revoked sessions'); };
  try {
    assert.equal(await config.callbacks.jwt({ token: { user: { id: 'ada' }, sessionIssuedAt: 1, sessionGeneration: 'old' } }), null);
    assert.equal(await config.callbacks.jwt({ token: { user: { id: 'ada' }, sessionIssuedAt: Date.now(), sessionGeneration: 'old' } }), null);
    assert.equal(requests, 0);
    const token = await config.callbacks.jwt({ token: {}, user: { id: 'ben', accessToken: 'new-token' } });
    assert.equal(token.user.id, 'ben');
    assert.equal(typeof token.sessionGeneration, 'string');
    assert.ok(token.sessionIssuedAt > policy.logoutTime(header));
    assert.equal(requests, 0);
  } finally { global.fetch = oldFetch; }
});

test('saved-account sign-in validates the server identity and refuses missing or expired credentials', async () => {
  process.env.AUTH_SECRET = 'local-tests-only-encryption-secret';
  process.env.AUTH_URL = 'https://kwonnet.test';
  let configuration;
  const load = modules({
    'next-auth': { __esModule: true, default: config => { configuration = config; return { handlers: {} }; }, CredentialsSignin: class extends Error {} },
    'next-auth/providers/credentials': { __esModule: true, default: provider => provider },
    'next/headers': { headers: async () => new Headers() },
  });
  load('src/auth.ts');
  const config = await configuration(new NextRequest('https://kwonnet.test/api/auth/callback/saved-account'));
  const provider = config.providers.find(provider => provider.id === 'saved-account');
  const vault = load('src/lib/saved-accounts.ts');
  const account = { id: 'ada', name: 'Ada', username: 'ada', accessToken: 'saved-private-token', savedAt: Date.now() };
  const cookie = `${vault.accountCookieName('ada', true)}=${await vault.encodeAccount(account, true)}`;
  const request = new Request('https://kwonnet.test/api/auth/callback/saved-account', { headers: { cookie } });
  const oldFetch = global.fetch;
  try {
    let requests = 0;
    global.fetch = async () => { requests++; return new Response(JSON.stringify({ user: { id: 'ada', avatar: 'avatar.jpg' }, accessToken: 'fresh-token' })); };
    const user = await provider.authorize({ accountId: 'ada' }, request);
    assert.equal(user.id, 'ada'); assert.equal(user.accessToken, 'fresh-token');
    await assert.rejects(() => provider.authorize({ accountId: 'unknown' }, request), /log in.*again/);
    assert.equal(requests, 1, 'an arbitrary account ID cannot mint a session');
    global.fetch = async () => new Response('{}', { status: 401 });
    await assert.rejects(() => provider.authorize({ accountId: 'ada' }, request), /log in.*again/);
    global.fetch = async () => new Response(JSON.stringify({ user: { id: 'other' }, accessToken: 'wrong-identity' }));
    await assert.rejects(() => provider.authorize({ accountId: 'ada' }, request), /log in.*again/);
  } finally { global.fetch = oldFetch; }
});

test('real Auth.js callbacks replace the active account cookie and the next session request stays authenticated', async () => {
  process.env.AUTH_SECRET = 'local-tests-only-encryption-secret';
  process.env.AUTH_URL = 'https://kwonnet.test';
  process.env.NEXT_PUBLIC_APP_URL = 'https://kwonnet.test';
  process.env.AUTH_TRUST_HOST = 'true';
  const { Auth } = require('@auth/core');
  const load = modules({
    './schema': { SignInSchema: { parse: value => value }, SignUpSchema: { parse: value => value } },
    'next-auth': { __esModule: true, CredentialsSignin: require('@auth/core/errors').CredentialsSignin, default: configure => {
      const handle = async request => Auth(request, { ...await configure(request), basePath: '/api/auth', trustHost: true });
      return { handlers: { GET: handle, POST: handle } };
    } },
  });
  const { handlers } = load('src/auth.ts');
  const jar = new Map([['kwonnet.active-session', 'previous-generation']]);
  const cookie = () => [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
  const apply = response => { for (const item of response.headers.getSetCookie()) {
    const pair = item.split(';')[0], index = pair.indexOf('=');
    if (/Max-Age=0/i.test(item)) jar.delete(pair.slice(0, index));
    else jar.set(pair.slice(0, index), pair.slice(index + 1));
  } };
  const oldFetch = global.fetch;
  let identity = 'new';
  const accessToken = `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })).toString('base64url')}.signature`;
  global.fetch = async () => new Response(JSON.stringify({ user: { id: identity, name: identity, username: identity, bio: 'x'.repeat(6000) }, accessToken }));
  try {
    for (const provider of ['credentials-in', 'saved-account']) {
      // A response generated for the previous account may arrive after sign-in.
      const lateSession = await handlers.GET(new NextRequest('https://kwonnet.test/api/auth/session', { headers: { cookie: cookie() } }));
      const csrf = await handlers.GET(new NextRequest('https://kwonnet.test/api/auth/csrf', { headers: { cookie: cookie() } }));
      apply(csrf);
      const { csrfToken } = await csrf.json();
      const response = await handlers.POST(new NextRequest(`https://kwonnet.test/api/auth/callback/${provider}`, {
        method: 'POST', headers: { cookie: cookie(), 'content-type': 'application/x-www-form-urlencoded', 'X-Auth-Return-Redirect': '1' },
        body: new URLSearchParams({ csrfToken, email: 'test@example.invalid', password: 'test-only-password', name: identity, accountId: identity, callbackUrl: 'https://kwonnet.test/' }),
      }));
      apply(response);
      assert.notEqual(jar.get('kwonnet.active-session'), 'previous-generation', 'callback must atomically activate the new JWT generation');
      assert.ok(response.headers.getSetCookie().some(cookie => cookie.startsWith('__Secure-authjs.session-token-') && cookie.split('=')[0].endsWith('.0')), 'large user profiles use chunked session cookies');
      const vault = load('src/lib/saved-accounts.ts');
      const saved = await vault.readSavedAccounts({ getAll: () => [...jar].map(([name, value]) => ({ name, value })) }, true);
      assert.ok(saved.some(account => account.id === identity), 'new registration/switch is saved during the callback, without a menu visit or refresh');
      apply(lateSession);
      const session = await handlers.GET(new NextRequest('https://kwonnet.test/api/auth/session', { headers: { cookie: cookie() } }));
      assert.equal((await session.json())?.user?.id, identity, 'client session read immediately after sign-in must retain the new identity');
      identity = provider === 'credentials-up' ? 'second' : 'new';
    }
  } finally { global.fetch = oldFetch; }
});

test('Google GET callbacks activate the Kwonnet session generation and save the linked account', async () => {
  const originalFetch = global.fetch;
  const priorId = process.env.AUTH_GOOGLE_ID, priorSecret = process.env.AUTH_GOOGLE_SECRET;
  process.env.AUTH_SECRET = 'local-tests-only-encryption-secret';
  process.env.AUTH_URL = 'https://kwonnet.test';
  process.env.AUTH_GOOGLE_ID = 'google-client'; process.env.AUTH_GOOGLE_SECRET = 'test-only-google-secret';
  let configuration;
  const apiUser = {id: 'kwon-google', name: 'Ada', email: 'ada@gmail.com', username: 'ada', avatar: 'avatar.png'};
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.example.invalid/api/v1/auth/google');
    assert.deepEqual(JSON.parse(options.body), {idToken: 'verified-id-token'});
    return {ok: true, json: async () => ({user: apiUser, accessToken: 'kwon-api-token'})};
  };
  const load = modules({
    'next-auth': {__esModule: true, CredentialsSignin: class extends Error {}, default: factory => {
      configuration = factory;
      return {handlers: {GET: async request => {
        const config = await factory(request);
        const user = {id: 'google-sub', name: 'Google Name', email: 'ada@gmail.com'};
        assert.equal(await config.callbacks.signIn({user, account: {provider: 'google', id_token: 'verified-id-token'}}), true);
        assert.equal(user.id, 'kwon-google');
        const jwt = await config.callbacks.jwt({token: {}, user});
        const cookieName = config.cookies.sessionToken.name;
        const encoded = await encode({token: jwt, secret: process.env.AUTH_SECRET, salt: cookieName});
        return new Response(null, {status: 302, headers: {'Set-Cookie': `${cookieName}=${encoded}; Path=/; HttpOnly; Secure`, Location: 'https://kwonnet.test/'}});
      }}};
    }},
    'next-auth/providers/credentials': {__esModule: true, default: provider => provider},
    'next-auth/providers/google': {__esModule: true, default: provider => ({id: 'google', ...provider})},
  });
  try {
    const {handlers} = load('src/auth.ts');
    const response = await handlers.GET(new NextRequest('https://kwonnet.test/api/auth/callback/google?code=code&state=state', {headers: {cookie: 'kwonnet.active-session=old-generation'}}));
    const cookies = response.headers.getSetCookie();
    assert.ok(cookies.some(cookie => cookie.startsWith('kwonnet.active-session=') && !cookie.includes('old-generation')));
    const vault = load('src/lib/saved-accounts.ts');
    assert.ok(cookies.some(cookie => cookie.startsWith(vault.accountCookieName('kwon-google', true) + '=')));
    const config = await configuration(new NextRequest('https://kwonnet.test/api/auth/callback/google?code=code'));
    assert.equal(await config.callbacks.signIn({user: {}, account: {provider: 'google'}}), false);
  } finally {
    global.fetch = originalFetch;
    if (priorId === undefined) delete process.env.AUTH_GOOGLE_ID; else process.env.AUTH_GOOGLE_ID = priorId;
    if (priorSecret === undefined) delete process.env.AUTH_GOOGLE_SECRET; else process.env.AUTH_GOOGLE_SECRET = priorSecret;
  }
});

test('backend session revocation invalidates NextAuth on polling without a refresh login event', async () => {
  let configuration;
  const load = modules({'next-auth': {__esModule: true, default: factory => {configuration = factory; return {handlers: {}};}, CredentialsSignin: class extends Error {}}, 'next-auth/providers/credentials': {__esModule: true, default: provider => provider}});
  load('src/auth.ts');
  const config = await configuration(new NextRequest('https://kwonnet.test/api/auth/session'));
  const previousFetch = global.fetch;
  try {
    const accessToken = `header.${Buffer.from(JSON.stringify({exp:Date.now()/1000+3600,iat:Date.now()/1000})).toString('base64url')}.signature`;
    global.fetch = async (url, options) => {assert.equal(url, 'https://api.example.invalid/api/v1/auth/session-status'); assert.equal(options.headers.Authorization, `Bearer ${accessToken}`); return {status: 401};};
    const token = {user: {id: 'owner', accessToken, sessionId: 'session'}, sessionIssuedAt: Date.now(),accessTokenRefreshedAt:Date.now()};
    assert.equal(await config.callbacks.jwt({token}), null);
  } finally {global.fetch = previousFetch;}
});

test('logout attempts backend revocation with the active bearer and still clears local cookies when the API is down', async () => {
  const originalFetch = global.fetch;
  const generation = '12245678-1234-1234-1234-123456789012';
  const cookieName = `__Secure-authjs.session-token-${generation}`;
  const token = await encode({token: {user: {id: 'owner', accessToken: 'api-secret', sessionId: 'sid'}}, secret: process.env.AUTH_SECRET, salt: cookieName});
  const route = modules({'@/auth': {auth: async () => {throw new Error('Logout must not refresh');}}})('src/app/api/accounts/route.ts');
  try {
    for (const offline of [false, true]) {
      let called = false;
      global.fetch = async (url, options) => {
        called = true; assert.equal(url, 'https://api.example.invalid/api/v1/auth/logout');
        assert.equal(options.headers.Authorization, 'Bearer api-secret');
        if (offline) throw new Error('offline'); return {ok: true};
      };
      const request = new NextRequest('https://kwonnet.test/api/accounts', {method: 'POST', headers: {origin: 'https://kwonnet.test', cookie: `kwonnet.active-session=${generation}; ${cookieName}=${token}`}, body: JSON.stringify({action: 'logout'})});
      const response = await route.POST(request);
      assert.equal(called, true); assert.equal((await response.json()).serverRevoked, !offline);
      assert.ok(response.headers.getSetCookie().some(value => value.startsWith(cookieName + '=') && value.includes('Max-Age=0')));
    }
  } finally {global.fetch = originalFetch;}
});

test('idle token expiry refreshes before verification and parallel tabs keep the same tracked identity',async()=>{
 let configuration;
 const load=modules({'next-auth':{__esModule:true,default:factory=>{configuration=factory;return {handlers:{}};},CredentialsSignin:class extends Error{}},'next-auth/providers/credentials':{__esModule:true,default:provider=>provider}});
 load('src/auth.ts');const config=await configuration(new NextRequest('https://kwonnet.test/api/auth/session'));
 const old=global.fetch;const calls=[];
 const expired=`header.${Buffer.from(JSON.stringify({exp:Date.now()/1000-60})).toString('base64url')}.signature`;
 const fresh=`header.${Buffer.from(JSON.stringify({exp:Date.now()/1000+86400})).toString('base64url')}.signature`;
 try{
  global.fetch=async(url,options)=>{calls.push(url);assert.equal(url,'https://api.example.invalid/api/v1/auth/refresh-token');assert.equal(JSON.parse(options.body).token,expired);return new Response(JSON.stringify({user:{id:'owner',sessionId:'session'},accessToken:fresh}));};
  const make=()=>({user:{id:'owner',accessToken:expired,sessionId:'session'},sessionIssuedAt:Date.now(),accessTokenRefreshedAt:Date.now()});
  const results=await Promise.all([config.callbacks.jwt({token:make()}),config.callbacks.jwt({token:make()})]);
  assert.equal(calls.length,2);for(const token of results){assert.equal(token.user.id,'owner');assert.equal(token.user.sessionId,'session');assert.equal(token.user.accessToken,fresh);}
 }finally{global.fetch=old;}
});
test('transient refresh/status failures preserve sessions but confirmed revocation still clears them',async()=>{
 let configuration;const load=modules({'next-auth':{__esModule:true,default:factory=>{configuration=factory;return {handlers:{}};},CredentialsSignin:class extends Error{}},'next-auth/providers/credentials':{__esModule:true,default:provider=>provider}});
 load('src/auth.ts');const config=await configuration(new NextRequest('https://kwonnet.test/api/auth/session'));const old=global.fetch;
 const accessToken=`header.${Buffer.from(JSON.stringify({exp:Date.now()/1000+86400})).toString('base64url')}.signature`;
 const make=(due=false)=>({user:{id:'owner',accessToken,sessionId:'session'},sessionIssuedAt:Date.now(),accessTokenRefreshedAt:Date.now()-(due?600000:0)});
 try{
  for(const due of [true,false]){
   global.fetch=async()=>{throw Error('temporary network outage');};const token=make(due);assert.equal(await config.callbacks.jwt({token}),token);
   global.fetch=async()=>new Response('temporarily unavailable',{status:503});const again=make(due);assert.equal(await config.callbacks.jwt({token:again}),again);
   global.fetch=async()=>new Response('revoked',{status:401});assert.equal(await config.callbacks.jwt({token:make(due)}),null);
  }
 }finally{global.fetch=old;}
});

test('linked account GET overlays the current authenticated identity on an older saved cookie', async () => {
  process.env.AUTH_SECRET = 'local-tests-only-encryption-secret';
  process.env.NEXT_PUBLIC_APP_URL = 'https://kwonnet.test';
  const user = {id: 'same', name: 'Updated', username: 'updated', avatar: 'new.png', accessToken: 'private'};
  const load = modules({'@/auth': {auth: async () => ({user})}});
  const vault = load('src/lib/saved-accounts.ts'), route = load('src/app/api/accounts/route.ts');
  const old = {id: 'same', name: 'Old', username: 'old', avatar: 'old.png', accessToken: 'private-old', savedAt: 1};
  const cookie = `${vault.accountCookieName(old.id, true)}=${await vault.encodeAccount(old, true)}`;
  const response = await route.GET(new NextRequest('https://kwonnet.test/api/accounts', {headers: {cookie}}));
  const [account] = await response.json();
  assert.equal(account.username, 'updated'); assert.equal(account.avatar, 'new.png'); assert.equal(account.active, true);
  assert.equal('accessToken' in account, false);
});
