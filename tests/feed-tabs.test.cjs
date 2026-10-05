const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
function load(file, mocks) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(id => id in mocks ? mocks[id] : require(id), module, module.exports);
  return module.exports;
}
test('tab selection always follows the route, including browser back navigation', () => {
  let segment = 'following';
  const noop = () => null;
  const data = load('src/data/index.ts', {});
  const Tabs = load('src/app/(dashboard)/(home)/FeedTabNavigation.tsx', {
    'next/navigation': { useSelectedLayoutSegment: () => segment },
    'next/link': { default: noop, __esModule: true },
    '@mui/material/Box': { default: noop, __esModule: true },
    '@mui/material/Tabs': { default: noop, tabsClasses: {}, __esModule: true },
    '@mui/material/Tab': { default: noop, __esModule: true },
    'react-sticky-box': { default: noop, __esModule: true }, '@/data': data,
  }).default;
  for (const [route, expected] of [['following', 1], ['friends', 2], ['latest', 4], ['following', 1], [null, 0]]) {
    segment = route;
    const tabs = Tabs().props.children.props.children.props.children;
    assert.equal(tabs.props.value, expected);
    assert.equal(tabs.props.children[expected].props.selected, true);
    assert.equal(tabs.props.children[expected].props.href, data.feedTabItems[expected].path);
  }
});
test('each feed mounts separately and cache keys distinguish viewers, tabs and pages', () => {
  const noop = () => null;
  const Section = load('src/components/post/FeedSection.tsx', {
    '@mui/material/Box': { default: noop, __esModule: true }, './FeedsDisplay': { default: noop, __esModule: true },
  }).default;
  for (const feed of ['foryou', 'following', 'friends', 'trending', 'latest']) {
    const child = Section({ posts: [{ id: feed }], feed }).props.children;
    assert.equal(child.key, feed); assert.equal(child.props.feed, feed);
  }
  const { newsfeedKey } = load('src/utils/newsfeed-key.ts', {});
  const keys = new Set();
  for (const user of ['ada', 'ben']) for (const feed of ['following', 'friends', 'latest', 'trending']) for (const page of [0, 1]) keys.add(JSON.stringify(newsfeedKey(user, feed, page)));
  assert.equal(keys.size, 16);
});
