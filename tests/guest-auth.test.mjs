import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { installGuestAuthTrigger } from "../src/utils/guest-auth-trigger.ts";

function fixture() {
  const dom = new JSDOM('<main><a data-auth-mode="signin" href="/wallet">Log in</a></main><div data-guest-auth-dialog><button>Submit</button></div>');
  const opened = [];
  return { dom, doc: dom.window.document, opened };
}

test("guest prompt appears after thirty seconds, once, and is cleaned up", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { doc, opened } = fixture();
  const cleanup = installGuestAuthTrigger(doc, mode => opened.push(mode));
  t.mock.timers.tick(29999); assert.deepEqual(opened, []);
  t.mock.timers.tick(1); assert.deepEqual(opened, ["signin"]);
  doc.querySelector('a').click(); assert.deepEqual(opened, ["signin"]);
  cleanup();
});

test("first click opens login and prevents navigation/actions underneath, while modal controls work", () => {
  const { dom, doc, opened } = fixture();
  const cleanup = installGuestAuthTrigger(doc, mode => opened.push(mode));
  try {
    let action = 0, submit = 0;
    doc.querySelector('a').addEventListener('click', () => action++);
    doc.querySelector('button').addEventListener('click', () => submit++);
    const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
    doc.querySelector('a').dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    assert.equal(action, 0);
    assert.deepEqual(opened, ['signin']);
    doc.querySelector('button').click();
    assert.equal(submit, 1);
  } finally { cleanup(); dom.window.close(); }
});

test("scrolling and touch gestures can browse the preview without opening authentication", () => {
  const { dom, doc, opened } = fixture();
  const cleanup = installGuestAuthTrigger(doc, mode => opened.push(mode));
  try {
    const modal = doc.querySelector('[data-guest-auth-dialog]');
    modal.scrollTop = 100; modal.dispatchEvent(new dom.window.Event('scroll'));
    assert.deepEqual(opened, []);
    const main = doc.querySelector('main');
    main.dispatchEvent(new dom.window.Event('scroll')); assert.deepEqual(opened, []);
    main.scrollTop = 20; main.dispatchEvent(new dom.window.Event('scroll'));
    assert.deepEqual(opened, []);
    const touch = new dom.window.Event('pointerdown', { bubbles: true, cancelable: true });
    main.dispatchEvent(touch);
    assert.equal(touch.defaultPrevented, false);
    const space = new dom.window.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    main.dispatchEvent(space);
    assert.equal(space.defaultPrevented, false);
    assert.deepEqual(opened, []);
  } finally { cleanup(); dom.window.close(); }
});

test("cleanup removes the timer and capture listeners after authentication or navigation", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { dom, doc, opened } = fixture();
  const cleanup = installGuestAuthTrigger(doc, mode => opened.push(mode));
  cleanup();
  t.mock.timers.tick(30000);
  const event = new dom.window.Event('click', { bubbles: true, cancelable: true });
  doc.querySelector('main').dispatchEvent(event);
  assert.deepEqual(opened, []);
  assert.equal(event.defaultPrevented, false);
  dom.window.close();
});

test("keyboard actions and shared-card requests open login, explicit signup remains available", () => {
  const { dom, doc, opened } = fixture();
  const input = doc.createElement('input'); doc.querySelector('main').append(input);
  let cleanup = installGuestAuthTrigger(doc, mode => opened.push(mode));
  try {
    const typing = new dom.window.KeyboardEvent('keydown', { key: 'k', bubbles: true, cancelable: true });
    input.dispatchEvent(typing);
    assert.equal(typing.defaultPrevented, true);
    assert.deepEqual(opened, ['signin']);
    cleanup(); opened.length = 0;
    cleanup = installGuestAuthTrigger(doc, mode => opened.push(mode));
    doc.dispatchEvent(new dom.window.Event('guest-auth-required'));
    assert.deepEqual(opened, ['signin']);
    cleanup(); opened.length = 0;
    cleanup = installGuestAuthTrigger(doc, mode => opened.push(mode));
    doc.querySelector('a').setAttribute('data-auth-mode', 'signup');
    doc.querySelector('a').click();
    assert.deepEqual(opened, ['signup']);
  } finally { cleanup(); dom.window.close(); }
});

test('public legal links bypass the guest gate for clicks and keyboard activation while protected links do not', () => {
  const dom = new JSDOM('<a href="/privacy-policy"><span>Privacy</span></a><a href="/terms-of-service">Terms</a><a href="https://other.invalid/privacy-policy">Other</a><a href="/wallet">Wallet</a>', {url: 'https://kwonnet.com/'});
  const opened = [];
  const cleanup = installGuestAuthTrigger(dom.window.document, mode => opened.push(mode));
  try {
    for (const target of [dom.window.document.querySelector('span'), dom.window.document.querySelectorAll('a')[1]]) {
      const event = new dom.window.MouseEvent('click', {bubbles: true, cancelable: true});
      target.dispatchEvent(event);
      assert.equal(event.defaultPrevented, false);
    }
    const key = new dom.window.KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true});
    dom.window.document.querySelector('a').dispatchEvent(key);
    assert.equal(key.defaultPrevented, false); assert.deepEqual(opened, []);
    const other = new dom.window.MouseEvent('click', {bubbles: true, cancelable: true});
    dom.window.document.querySelectorAll('a')[2].dispatchEvent(other);
    assert.equal(other.defaultPrevented, true); assert.deepEqual(opened, ['signin']);
  } finally {cleanup(); dom.window.close();}
});
