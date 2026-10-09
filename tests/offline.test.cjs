const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
const moduleFile = {exports: {}};
new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync('src/utils/offline.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText)(require, moduleFile, moduleFile.exports);
const {reconnectingFetch} = moduleFile.exports;
function browser() {
  const target = new EventTarget();
  target.location = {href: 'https://kwonnet.test/messages', origin: 'https://kwonnet.test'};
  target.setTimeout = setTimeout; target.clearTimeout = clearTimeout;
  return target;
}
test('offline read remains pending then resumes the same request on reconnect', async () => {
  const page = browser(), connection = {onLine: false}; let calls = 0, settled = false;
  const read = reconnectingFetch(async () => {calls++; return new Response('messages');}, page, connection);
  const pending = read('/api/messages').then(response => {settled = true; return response;});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 0); assert.equal(settled, false);
  connection.onLine = true; page.dispatchEvent(new Event('online'));
  assert.equal(await (await pending).text(), 'messages'); assert.equal(calls, 1);
});
test('network failure without an offline browser hint resumes without throwing into the page', async () => {
  const page = browser(); let calls = 0;
  const read = reconnectingFetch(async () => {if (++calls === 1) throw new TypeError('Failed to fetch'); return new Response('restored');}, page, {onLine: true});
  const pending = read('/messages?_rsc=1');
  await new Promise(resolve => setImmediate(resolve)); page.dispatchEvent(new Event('online'));
  assert.equal(await (await pending).text(), 'restored'); assert.equal(calls, 2);
});
test('mutations are never retried and HTTP authorization errors remain authoritative', async () => {
  let calls = 0;
  const read = reconnectingFetch(async () => {calls++; throw new TypeError('offline');}, browser(), {onLine: false});
  await assert.rejects(read('/api/payment', {method: 'POST'}), /offline/); assert.equal(calls, 1);
  const forbidden = reconnectingFetch(async () => new Response('', {status: 401}), browser(), {onLine: true});
  assert.equal((await forbidden('/api/auth/session')).status, 401);
});
test('aborting a waiting read rejects immediately and does not resend it', async () => {
  const page = browser(), controller = new AbortController(); let calls = 0;
  const read = reconnectingFetch(async () => {calls++; return new Response();}, page, {onLine: false});
  const pending = read('/api/messages', {signal: controller.signal}); controller.abort();
  await assert.rejects(pending, {name: 'AbortError'}); page.dispatchEvent(new Event('online')); assert.equal(calls, 0);
});
test('disconnect keeps the mounted page and drafts, blocks offline navigation and restores navigation online', async () => {
  const React = require('react'), {JSDOM} = require('jsdom');
  const dom = new JSDOM('<div id="root"></div>', {url: 'https://kwonnet.test/messages'});
  const saved = Object.fromEntries(['window','document','navigator','Element','location','IS_REACT_ACT_ENVIRONMENT'].map(key => [key, Object.getOwnPropertyDescriptor(global, key)]));
  for (const key of ['window','document','navigator','Element','location']) Object.defineProperty(global, key, {configurable: true, value: key === 'window' ? dom.window : dom.window[key]});
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.fetch = async () => new Response('ok');
  let online = true, mounts = 0;
  Object.defineProperty(navigator, 'onLine', {get: () => online, configurable: true});
  const component = {exports: {}};
  new Function('require','module','exports', ts.transpileModule(fs.readFileSync('src/providers/ConnectivityProvider.tsx','utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText)(name => name === '@/utils/offline' ? moduleFile.exports : name === '@/config/public-env' ? {publicEnv: () => undefined} : name === '@mui/material' ? {Box: ({children, sx, ...props}) => React.createElement('div', props, children)} : require(name), component, component.exports);
  function Page() {React.useEffect(() => {mounts++;}, []); return React.createElement('div', null, React.createElement('input', {defaultValue: 'unsent draft'}), React.createElement('a', {href: '/wallet'}, 'Wallet'));}
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(component.exports.default, null, React.createElement(Page))));
    const input = document.querySelector('input'); input.value = 'keep this draft';
    await React.act(async () => {online = false; window.dispatchEvent(new window.Event('offline'));});
    assert.equal(mounts, 1); assert.equal(document.querySelector('input'), input); assert.equal(input.value, 'keep this draft');
    assert.match(document.querySelector('[role="status"]').textContent, /offline/);
    const click = new window.MouseEvent('click', {bubbles: true, cancelable: true}); document.querySelector('a').dispatchEvent(click); assert.equal(click.defaultPrevented, true);
    await React.act(async () => {online = true; window.dispatchEvent(new window.Event('online'));});
    assert.equal(document.querySelector('[role="status"]'), null); assert.equal(mounts, 1);
    const restored = new window.MouseEvent('click', {bubbles: true, cancelable: true}); document.querySelector('a').addEventListener('click', event => {assert.equal(event.defaultPrevented, false); event.preventDefault();}, {once: true}); document.querySelector('a').dispatchEvent(restored);
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    for (const [key, descriptor] of Object.entries(saved)) {if (descriptor) Object.defineProperty(global, key, descriptor); else delete global[key];}
  }
});
test('Axios network reads resume after reconnect without replaying writes', async () => {
  const axios = require('axios'); const saved = Object.getOwnPropertyDescriptor(global, 'window');
  Object.defineProperty(global, 'window', {configurable: true, value: browser()});
  const configModule = {exports: {}};
  const wallet = {isWalletCharge: () => false};
  new Function('require','module','exports', ts.transpileModule(fs.readFileSync('src/config/axios.ts','utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true}}).outputText)(name => name === '@/utils/offline' ? moduleFile.exports : name === '@/config/public-env' ? {publicEnv: () => 'https://api.kwonnet.test'} : name === '@/utils/wallet-intents' ? wallet : name === 'next-auth/react' ? {getSession: async () => null} : require(name), configModule, configModule.exports);
  const client = configModule.exports.axiosAPI; let calls = 0;
  client.defaults.adapter = async config => {if (++calls === 1 || config.method === 'post') throw new axios.AxiosError('offline', 'ERR_NETWORK', config); return {status: 200, statusText: 'OK', data: {id: 1}, headers: {}, config};};
  try {
    const pending = client.get('/v1/posts'); await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls, 1); window.dispatchEvent(new Event('online'));
    assert.deepEqual((await pending).data, {id: 1}); assert.equal(calls, 2);
    await assert.rejects(client.post('/v1/posts', {}), /offline/); assert.equal(calls, 3);
  } finally {if (saved) Object.defineProperty(global, 'window', saved); else delete global.window;}
});
