const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {readFileSync} = require('node:fs');
const ts = require('typescript');
function client(permission = 'granted') {
 const requests = [], shown = []; let active = true;
 const subscription = {endpoint: 'https://fcm.googleapis.com/device', options: {}, toJSON: () => ({endpoint: 'https://fcm.googleapis.com/device'}), unsubscribe: async () => {active = false;}};
 const registration = {active: {}, showNotification: async (...args) => shown.push(args), pushManager: {getSubscription: async () => active ? subscription : null, subscribe: async () => {throw Error('Existing subscription must be reused');}}};
 const module = {exports: {}};
 const context = {module, exports: module.exports, Uint8Array, AbortSignal, URL,
  window: {isSecureContext: true, location: {origin: 'https://kwonnet.test'}, PushManager: {}, Notification: {}, atob},
  Notification: {permission, requestPermission: async () => permission},
  navigator: {serviceWorker: {register: async () => registration, ready: Promise.resolve(registration), getRegistration: async () => registration}},
  fetch: async (url, options) => {requests.push({url, options}); return {ok: true};},
  require: id => ({'@/config/public-env': {publicEnv: () => Buffer.alloc(65, 4).toString('base64url')}, '@/config': {apiUrl: 'https://api.test/api/v1'}, '.': {getErrorMessage: error => error.message}}[id]),
 };
 vm.runInNewContext(ts.transpileModule(readFileSync('src/utils/pushClient.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText, context);
 return {api: module.exports, requests, shown, registration, context, active: () => active};
}
test('device test uses the active service worker without sending or saving a server push', async () => {
 const c = client(); await c.api.testDeviceNotification();
 assert.equal(c.requests.length, 0); assert.equal(c.shown.length, 1);
 assert.equal(c.shown[0][1].data.url, 'https://kwonnet.test/settings');
});
test('device test reports denied permission and missing active worker', async () => {
 const denied = client('denied'); await assert.rejects(denied.api.testDeviceNotification(), /Enable push/); assert.equal(denied.shown.length, 0);
 const inactive = client(); inactive.registration.active = null;
 await assert.rejects(inactive.api.testDeviceNotification(), /Reload Kwonnet/); assert.equal(inactive.shown.length, 0);
});
test('enabling existing subscriptions persists the selected account using the correct API URL', async () => {
 const c = client(); assert.equal((await c.api.subscribeUserToPush('token')).status, 200);
 assert.equal(c.requests[0].url, 'https://api.test/api/v1/notifications/subscribe');
 assert.equal(c.requests[0].options.headers.Authorization, 'Bearer token');
});
test('disabling removes API binding and unsubscribes the browser', async () => {
 const c = client(); assert.equal((await c.api.subscribeUserToPush('token', false)).status, 200);
 assert.equal(c.requests[0].url, 'https://api.test/api/v1/notifications/unsubscribe'); assert.equal(c.active(), false);
});
test('failed server cleanup still disables browser delivery and reports failure', async () => {
 const c = client(); c.context.fetch = async () => ({ok: false});
 assert.equal((await c.api.subscribeUserToPush('token', false)).status, 400); assert.equal(c.active(), false);
});
test('denied permission never stores subscriptions', async () => {
 const c = client('denied'); assert.equal((await c.api.subscribeUserToPush('token')).status, 400); assert.equal(c.requests.length, 0);
});
test('automatic account synchronization never requests permission', async () => {
 const c = client(); c.context.Notification.requestPermission = () => {throw Error('Must be a user gesture');};
 await c.api.syncExistingPushSubscription('new-token'); assert.equal(c.requests[0].options.headers.Authorization, 'Bearer new-token');
});
test('service worker keeps delivery alive and opens a same-origin notification target', async () => {
 const handlers = {}, shown = [], opened = []; let pending;
 const self = {location: {origin: 'https://kwonnet.test'}, addEventListener: (name, handler) => {handlers[name] = handler;}, registration: {showNotification: async (...args) => shown.push(args)}, clients: {matchAll: async () => [], openWindow: async url => opened.push(url)}};
 vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {self, URL});
 handlers.push({data: {json: () => ({title: 'Like', body: 'New like', tag: 'n1', url: 'https://evil.test'})}, waitUntil: value => {pending = value;}}); await pending;
 assert.equal(shown[0][0], 'Like'); assert.equal(shown[0][1].data.url, 'https://kwonnet.test/notifications');
 handlers.notificationclick({notification: {data: shown[0][1].data, close() {}}, waitUntil: value => {pending = value;}}); await pending;
 assert.deepEqual(opened, ['https://kwonnet.test/notifications']);
});
test('notification click navigates an existing tab to the post and falls back when that tab cannot navigate', async () => {
 const handlers={}, opened=[], navigations=[];let pending;let fail=false;let focused=0;
 const client={url:'https://kwonnet.test/settings',navigate:async url=>{navigations.push(url);if(fail)throw Error('Tab closed');return client;},focus:async()=>{focused++;return client;}};
 const self={location:{origin:'https://kwonnet.test'},addEventListener:(name,handler)=>handlers[name]=handler,clients:{matchAll:async()=>[client],openWindow:async url=>opened.push(url)}};
 vm.runInNewContext(readFileSync('public/sw.js','utf8'),{self,URL});
 const click=()=>handlers.notificationclick({notification:{data:{url:'https://kwonnet.test/@author/feed/post'},close(){}},waitUntil:value=>pending=value});
 click();await pending;assert.equal(focused,1);assert.deepEqual(navigations,['https://kwonnet.test/@author/feed/post']);assert.equal(opened.length,0);
 fail=true;click();await pending;assert.deepEqual(opened,['https://kwonnet.test/@author/feed/post']);
});
