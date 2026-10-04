const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');

test('linked account menus share requests and cached profiles while separating active identities', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://kwonnet.test' });
  const previous = { window: global.window, document: global.document, fetch: global.fetch, act: global.IS_REACT_ACT_ENVIRONMENT };
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const originalSetTimeout = global.setTimeout;
  // SWR's minute-long deduplication cleanup must not keep the Node test alive.
  global.setTimeout = (callback, delay, ...args) => {
    const timer = originalSetTimeout(callback, delay, ...args);
    if (delay >= 60_000) timer.unref();
    return timer;
  };
  // Initialize SWR after installing the browser environment.
  const swr = require('swr');
  const { createRoot } = require('react-dom/client');
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync('src/hooks/useSavedAccounts.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  const useSavedAccounts = module.exports.default;
  const cache = new Map(), seen = {};
  let requests = 0, identity = 'ada';
  global.fetch = async (url, options) => {
    assert.equal(url, '/api/accounts'); assert.equal(options.cache, 'no-store');
    requests++;
    return new Response(JSON.stringify([{ id: identity, name: identity, username: identity, active: true }]));
  };
  function Menu({ id, slot }) {
    seen[slot] = useSavedAccounts(id);
    return React.createElement('div', null, seen[slot].data?.[0]?.id);
  }
  const config = { provider: () => cache };
  const root = createRoot(document.getElementById('root'));
  async function render(children) {
    await React.act(async () => {
      root.render(React.createElement(swr.SWRConfig, { value: config }, children));
      await new Promise(resolve => setTimeout(resolve, 25));
    });
  }
  try {
    await render([React.createElement(Menu, { id: 'ada', slot: 'a', key: 'a' }), React.createElement(Menu, { id: 'ada', slot: 'b', key: 'b' })]);
    assert.equal(requests, 1, 'concurrent menus deduplicate requests');
    assert.equal(seen.a.data[0].id, 'ada');
    await render(null);
    await render(React.createElement(Menu, { id: 'ada', slot: 'a' }));
    assert.equal(requests, 1, 'reopening a menu uses cached data');
    assert.equal(seen.a.data[0].id, 'ada');
    identity = 'ben';
    await render(React.createElement(Menu, { id: 'ben', slot: 'b' }));
    assert.equal(requests, 2);
    assert.equal(seen.b.data[0].id, 'ben', 'another identity never receives the previous cached list');
    await React.act(async () => { await seen.b.mutate(); });
    assert.equal(requests, 3, 'an explicit refresh bypasses the cache');
    await render(React.createElement(Menu, { slot: 'guest' }));
    assert.equal(seen.guest.data, undefined);
    assert.equal(requests, 3, 'guests do not fetch linked accounts');
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
    global.setTimeout = originalSetTimeout;
    global.window = previous.window; global.document = previous.document; global.fetch = previous.fetch; global.IS_REACT_ACT_ENVIRONMENT = previous.act;
  }
});
