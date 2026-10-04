import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let observer;
class Observer {
  constructor(callback, options) { this.callback = callback; this.options = options; observer = this; }
  observe(target) { this.target = target; }
  unobserve() {}
  disconnect() {}
  enter() { this.callback([{ target: this.target, isIntersecting: true, intersectionRatio: 1 }]); }
}
globalThis.IntersectionObserver = Observer;
window.IntersectionObserver = Observer;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const source = await readFile(new URL('../src/hooks/useLoadMore.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  .replace(/from "(react|react-intersection-observer)"/g, (_, name) => `from ${JSON.stringify(import.meta.resolve(name))}`);
const { default: useLoadMore } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('loads ahead of the bottom, pauses while fetching, and resumes if the sentinel stays visible', async () => {
  const root = createRoot(document.getElementById('root'));
  let requests = 0;
  function Feed({ enabled }) {
    const ref = useLoadMore(() => { requests++; }, enabled, '0px 0px 1600px 0px');
    return React.createElement('div', { ref });
  }
  try {
    await React.act(async () => root.render(React.createElement(Feed, { enabled: true })));
    assert.equal(observer.options.rootMargin, '0px 0px 1600px 0px');
    await React.act(async () => observer.enter());
    assert.equal(requests, 1);
    // A rerender/new callback identity must not issue a duplicate request.
    await React.act(async () => root.render(React.createElement(Feed, { enabled: true })));
    assert.equal(requests, 1);
    await React.act(async () => root.render(React.createElement(Feed, { enabled: false })));
    await React.act(async () => observer.enter());
    assert.equal(requests, 1);
    await React.act(async () => root.render(React.createElement(Feed, { enabled: true })));
    assert.equal(requests, 2);
  } finally { await React.act(async () => root.unmount()); }
});
