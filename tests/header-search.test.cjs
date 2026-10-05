const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');
function load(path, dependencies) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(id => id in dependencies ? dependencies[id] : require(id), module, module.exports);
  return module.exports;
}
test('header search debounces user suggestions, isolates identities, submits typed queries and opens selected profiles', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://kwonnet.test/search?q=solar' });
  const prior = { window: global.window, document: global.document, act: global.IS_REACT_ACT_ENVIRONMENT };
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = require('react-dom/client');
  let autocomplete, swrKey, swrFetcher;
  const pushed = [], calls = [];
  const Container = ({ children }) => React.createElement('div', null, children);
  const dependencies = {
    '@mui/material': { Box: Container, Avatar: Container, CircularProgress: Container, IconButton: Container, ListItemAvatar: Container, ListItemText: Container, TextField: Container,
      Autocomplete: props => { autocomplete = props; return React.createElement('div', null, 'Search'); } },
    '@mui/icons-material/SearchOutlined': { __esModule: true, default: () => null },
    'next/navigation': { useRouter: () => ({ push: url => pushed.push(url) }), usePathname: () => '/search', useSearchParams: () => new URLSearchParams('q=solar') },
    '@/hooks': { useAuthSession: () => ({ user: { id: 'viewer' }, token: 'token' }) },
    '@/lib/users': { searchUsers: async (...args) => { calls.push(args); return []; } },
    '@/utils/post-text': load('src/utils/post-text.ts', {}),
    'swr': { __esModule: true, default: (key, fetcher) => { swrKey = key; swrFetcher = fetcher; return { data: [], isLoading: false, fetcher }; } },
  };
  const SearchToolbar = load('src/components/common/SearchToolbar.tsx', dependencies).default;
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(SearchToolbar)));
    assert.equal(autocomplete.inputValue, 'solar'); assert.equal(swrKey, null);
    await React.act(async () => autocomplete.onOpen());
    await React.act(async () => { await new Promise(resolve => setTimeout(resolve, 320)); });
    assert.deepEqual(swrKey, ['search-user-dropdown', 'viewer', 'solar']);
    await swrFetcher(swrKey);
    assert.deepEqual(calls[0], [{ query: 'solar', limit: 6 }, 'token']);
    await React.act(async () => autocomplete.onInputChange(null, 'Solar & energy', 'input'));
    assert.equal(swrKey, null, 'previous query results must not remain visible while typing');
    const event = { key: 'Enter', nativeEvent: { isComposing: false }, preventDefault() {} };
    await React.act(async () => autocomplete.onKeyDown(event));
    assert.equal(event.defaultMuiPrevented, true);
    const url = new URL(pushed[0], 'https://kwonnet.test');
    assert.equal(url.pathname, '/search'); assert.equal(url.searchParams.get('q'), 'Solar & energy'); assert.equal(url.searchParams.get('src'), 'typed_query');
    await React.act(async () => autocomplete.onChange(null, { username: 'ada', name: 'Ada' }));
    assert.equal(pushed[1], '/@ada');
  } finally {
    await React.act(async () => root.unmount()); dom.window.close(); global.window = prior.window; global.document = prior.document; global.IS_REACT_ACT_ENVIRONMENT = prior.act;
  }
});
