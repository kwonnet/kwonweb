const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const ts = require('typescript');
const React = require('react');
const {JSDOM} = require('jsdom');
function load(file, mocks) {
  const module = {exports: {}};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
  new Function('require', 'module', 'exports', code)(id => id in mocks ? mocks[id] : require(id), module, module.exports);
  return module.exports.default;
}
test('messaging provider lives in the root and chat navigation remounts only the conversation detail',()=>{
 const root=readFileSync('src/app/layout.tsx','utf8');assert.match(root,/<ConvoSocketIoProvider>/);
 assert.doesNotMatch(readFileSync('src/app/(dashboard)/messages/layout.tsx','utf8'),/<ConvoSocketIoProvider>/);
 assert.match(readFileSync('src/app/(dashboard)/messages/[[...slug]]/ChatBoxServer.tsx','utf8'),/key=\{recipientId\}/);
});
test('start message lists mutual friends, searches all users and opens a non-friend chat', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const {createRoot} = require('react-dom/client');
  let field, resolveOld;
  const pushed = [], calls = [];
  const Container = ({children}) => React.createElement('div', null, children);
  const Button = ({children, onClick, disabled}) => React.createElement('button', {onClick, disabled}, children);
  const mocks = {
    '@mui/icons-material': {Add: () => null, Close: () => null, ChatBubbleOutlined: () => null},
    '@mui/material': {Alert: Container, Avatar: () => null, Box: Container, Button, Fab: Button, CircularProgress: () => null, Dialog: ({open, children}) => open ? React.createElement('div', null, children) : null,
      DialogContent: Container, DialogTitle: Container, IconButton: Button, List: Container, ListItemButton: Button, ListItemAvatar: Container,
      ListItemText: ({primary, secondary}) => React.createElement('span', null, primary, secondary), Typography: Container,
      TextField: props => {field = props; return null;}},
    'next/navigation': {useRouter: () => ({push: url => pushed.push(url)})},
    '@/hooks': {useAuthSession: () => ({user: {id: 'me'}, token: 'token'})},
    '@/lib/users': {
      getMessagingFriends: async (...args) => {calls.push(['friends', ...args]); return [{id: 'friend', name: 'Friend', username: 'friend'}];},
      searchUsers: async (...args) => {
        calls.push(['search', ...args]);
        if (args[0].query === 'old') return new Promise(resolve => {resolveOld = resolve;});
        return [{id: 'me', name: 'Self', username: 'self'}, {id: 'stranger', name: 'Stranger', username: 'stranger'}];
      },
    },
  };
  const Picker = load('src/app/(dashboard)/messages/[[...slug]]/NewConversationButton.tsx', mocks);
  const root = createRoot(document.getElementById('root'));
  const pause = async () => React.act(async () => {await new Promise(resolve => setTimeout(resolve, 330));});
  try {
    await React.act(async () => root.render(React.createElement(Picker)));
    assert.equal(calls.length, 0);
    await React.act(async () => document.querySelector('button').click());
    assert.match(document.body.textContent, /Friend@friend/);
    assert.deepEqual(calls[0], ['friends', 'me', 1, 'token']);
    await React.act(async () => field.onChange({target: {value: 'old'}})); await pause();
    await React.act(async () => field.onChange({target: {value: 'stranger'}})); await pause();
    await React.act(async () => resolveOld([{id: 'stale', name: 'Stale', username: 'stale'}]));
    assert.doesNotMatch(document.body.textContent, /Stale|Self@self/);
    assert.match(document.body.textContent, /Stranger@stranger/);
    assert.deepEqual(calls.at(-1), ['search', {query: 'stranger', page: 1, limit: 20, scope: 'messaging'}, 'token']);
    await React.act(async () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Stranger@stranger').click());
    assert.deepEqual(pushed, ['/messages/stranger/chat']);
  } finally {await React.act(async () => root.unmount()); dom.window.close();}
});
