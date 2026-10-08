const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const ts = require('typescript');
const React = require('react');
const {JSDOM} = require('jsdom');
test('settings paginates account-scoped sessions and revokes only the selected session', async () => {
 const dom = new JSDOM('<div id="root"></div>', {url: 'https://kwonnet.test/settings'});
 const previous = {window: global.window, document: global.document, act: global.IS_REACT_ACT_ENVIRONMENT};
 global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
 const {createRoot} = require('react-dom/client'); let key, logout = 0, account = {username: 'owner', hasPassword: true}, passwordForm; const revoked = [], notices = [], passwordUpdates = [], fields = {};
 const session = {id: 'other-session', provider: 'GOOGLE', current: false, device: {browser: 'Chrome', os: 'Mac'}, location: {city: 'Lagos', country: 'NG'}, lastActiveAt: new Date().toISOString()};
 const Box = props => {if (props.component === 'form' && props.sx?.mt === 3) passwordForm = props; return React.createElement('div', null, props.children);};
 const Button = ({children, onClick, disabled}) => React.createElement('button', {onClick, disabled}, children);
 const mocks = {
  react: React, '@mui/material': {Alert: Box, Box, Button, Chip: ({label}) => React.createElement('span', null, label), CircularProgress: Box, Container: Box, FormControlLabel: Box, Paper: Box, Stack: Box, Switch: Box, TextField: props => {fields[props.label] = props;return null;}, Typography: Box},
  'next-auth/react': {useSession: () => ({update: async () => {}})},
  '@/lib/profile-actions': {saveProfile: async () => ({})},
  '@/hooks/useRefreshProfileIdentity': {__esModule: true, default: () => async () => {}},
  '@/hooks': {useAuthSession: () => ({token: 'test-token', user: {id: 'owner'}})},
  '@/providers/NotificationsProvider': {useNotifications: () => ({show: message => notices.push(message)})},
  '@/utils/pushClient': {subscribeUserToPush: async () => ({status: 200, message: 'Enabled'})},
  '@/lib/auth': {changePassword: async (...args) => {passwordUpdates.push(args);return {};}, getActiveSessions: async () => ({}), revokeActiveSession: async (...args) => revoked.push(args)},
  '@/lib/account-actions': {rememberCurrentAccount: async () => {}, logoutCurrentAccount: async () => {logout++;}},
  swr: {__esModule: true, default: currentKey => {if (currentKey?.[0] === 'account-settings') return {data: account, mutate: async () => {}}; key = currentKey; return {data: {sessions: [session], hasMore: currentKey[3] === 1}, mutate: async () => {}};}},
 };
 const module = {exports: {}};
 const code = ts.transpileModule(readFileSync('src/app/(dashboard)/settings/PageClient.tsx', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
 new Function('require', 'module', 'exports', code)(id => id in mocks ? mocks[id] : require(id), module, module.exports);
 const root = createRoot(document.getElementById('root'));
 try {
  await React.act(async () => root.render(React.createElement(module.exports.default)));
  assert.deepEqual(key, ['active-sessions', 'owner', 'test-token', 1]);
  assert.match(document.body.textContent, /Chrome on Mac/); assert.match(document.body.textContent, /Lagos, NG/);
  await React.act(async () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Next').click());
  assert.equal(key[3], 2);
  await React.act(async () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Revoke').click());
  assert.deepEqual(revoked, [['test-token', 'other-session']]); assert.equal(logout, 0); assert.ok(notices.includes('Session revoked.'));
  account = undefined;
  await React.act(async () => root.render(React.createElement(module.exports.default)));
  assert.equal([...document.querySelectorAll('button')].find(button => button.textContent === 'Update password').disabled, true);
  account = {username: 'owner', hasPassword: false};
  await React.act(async () => root.render(React.createElement(module.exports.default)));
  assert.equal([...document.querySelectorAll('button')].find(button => button.textContent === 'Update password').disabled, false, 'passwordless Google accounts can submit once their settings load');
  await React.act(async () => {fields['New password'].onChange({target: {value: 'new-password'}});fields['Confirm new password'].onChange({target: {value: 'new-password'}});});
  await React.act(async () => passwordForm.onSubmit({preventDefault() {}}));
  assert.deepEqual(passwordUpdates, [['test-token', undefined, 'new-password']]);
  assert.ok(notices.includes('Password updated. Other sessions have been signed out.'));
 } finally {await React.act(async () => root.unmount()); global.window = previous.window; global.document = previous.document; global.IS_REACT_ACT_ENVIRONMENT = previous.act; dom.window.close();}
});
