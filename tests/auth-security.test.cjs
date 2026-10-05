const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const ts = require('typescript');
const {createHmac} = require('node:crypto');
function load(path, mocks = {}) {
 const module = {exports: {}};
 const code = ts.transpileModule(readFileSync(path, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
 new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
 return module.exports;
}
test('signed browser metadata excludes credentials and never trusts forwarding headers by default', () => {
 const priorKey = process.env.AUTH_TELEMETRY_SHARED_SECRET, priorHeader = process.env.AUTH_TRUSTED_WEB_IP_HEADER;
 process.env.AUTH_TELEMETRY_SHARED_SECRET = 's'.repeat(32); delete process.env.AUTH_TRUSTED_WEB_IP_HEADER;
 const {authRequestContextHeaders} = load('src/lib/auth-request-context.ts');
 try {
  const headers = new Headers({'user-agent': 'Chrome test', 'x-forwarded-for': '1.2.3.4', 'cookie': 'secret-cookie', 'authorization': 'Bearer secret-token'});
  let signed = authRequestContextHeaders(headers);
  let data = JSON.parse(Buffer.from(signed['x-kwonnet-auth-context'], 'base64url'));
  assert.equal(data.ip, null); assert.equal(data.agent, 'Chrome test');
  assert.equal(signed['x-kwonnet-auth-signature'], createHmac('sha256', 's'.repeat(32)).update(signed['x-kwonnet-auth-context']).digest('hex'));
  assert.doesNotMatch(JSON.stringify(data), /secret|Bearer|cookie/);
  process.env.AUTH_TRUSTED_WEB_IP_HEADER = 'x-real-ip'; headers.set('x-real-ip', '198.51.100.12');
  signed = authRequestContextHeaders(headers); data = JSON.parse(Buffer.from(signed['x-kwonnet-auth-context'], 'base64url'));
  assert.equal(data.ip, '198.51.100.12');
  headers.set('x-real-ip', '1.2.3.4, 8.8.8.8'); assert.equal(JSON.parse(Buffer.from(authRequestContextHeaders(headers)['x-kwonnet-auth-context'], 'base64url')).ip, null);
  process.env.AUTH_TELEMETRY_SHARED_SECRET = ''; assert.deepEqual(authRequestContextHeaders(headers), {});
 } finally {
  if (priorKey === undefined) delete process.env.AUTH_TELEMETRY_SHARED_SECRET; else process.env.AUTH_TELEMETRY_SHARED_SECRET = priorKey;
  if (priorHeader === undefined) delete process.env.AUTH_TRUSTED_WEB_IP_HEADER; else process.env.AUTH_TRUSTED_WEB_IP_HEADER = priorHeader;
 }
});
test('SSE uses same-origin auth and passes tokens only in backend authorization headers', async () => {
 const previousFetch = global.fetch; let current = {user: {accessToken: 'api-secret'}};
 const {GET} = load('src/app/api/events/route.ts', {'@/config': {apiUrl: 'https://api.test/api/v1'}, '@/lib/server-session': {getServerSession: async () => current}});
 try {
  global.fetch = async (url, options) => {assert.equal(url, 'https://api.test/api/v1/stream'); assert.equal(options.headers.Authorization, 'Bearer api-secret'); return new Response('data: {}\n\n', {headers: {'Content-Type': 'text/event-stream'}});};
  const response = await GET(new Request('https://kwonnet.test/api/events'));
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'private, no-store'); assert.equal(await response.text(), 'data: {}\n\n');
  current = null; assert.equal((await GET(new Request('https://kwonnet.test/api/events'))).status, 401);
  current = {user: {accessToken: 'api-secret'}};
  global.fetch = async () => new Response(null, {status: 401}); assert.equal((await GET(new Request('https://kwonnet.test/api/events'))).status, 401);
  global.fetch = async () => {throw new Error('private network error');}; assert.equal((await GET(new Request('https://kwonnet.test/api/events'))).status, 503);
 } finally {global.fetch = previousFetch;}
});

test('revoked frontend sessions unmount private content while public legal reading remains available', async () => {
 let status = 'authenticated', path = '/', redirects = [];
 const previousWindow = global.window;
 global.window = {location: {replace: url => redirects.push(url)}};
 const policy = load('src/lib/auth-redirect.ts');
 const Boundary = load('src/providers/AuthSessionBoundary.tsx', {
  '@/utils/pushClient': {clearBrowserPushSubscription: async () => {}, syncExistingPushSubscription: async () => {}},
  react: {useEffect: effect => effect()}, 'next-auth/react': {useSession: () => ({status})},
  'next/navigation': {usePathname: () => path}, '@/lib/auth-redirect': policy,
 }).default;
 try {
  assert.equal(Boundary({initiallyAuthenticated: true, children: 'private'}), 'private');
  status = 'unauthenticated'; assert.equal(Boundary({initiallyAuthenticated: true, children: 'private'}), null); await new Promise(resolve => setImmediate(resolve)); assert.deepEqual(redirects, ['/']);
  path = '/privacy-policy'; assert.equal(Boundary({initiallyAuthenticated: true, children: 'public'}), 'public'); await new Promise(resolve => setImmediate(resolve)); assert.deepEqual(redirects, ['/']);
  path = '/'; assert.equal(Boundary({initiallyAuthenticated: false, children: 'guest'}), 'guest');
 } finally {global.window = previousWindow;}
});
