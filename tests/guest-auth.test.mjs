import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { installGuestAuthTrigger } from "../src/utils/guest-auth-trigger.ts";

function fixture() {
  const dom = new JSDOM('<main><a data-auth-mode="signin" href="/wallet">Log in</a></main><div data-guest-auth-dialog><button>Submit</button></div>');
  const opened = [];
  return { dom, doc: dom.window.document, opened };
}

test("guest prompt appears after ten seconds, once, and is cleaned up", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { doc, opened } = fixture();
  const cleanup = installGuestAuthTrigger(doc, mode => opened.push(mode));
  t.mock.timers.tick(9999); assert.deepEqual(opened, []);
  t.mock.timers.tick(1); assert.deepEqual(opened, ["signup"]);
  doc.querySelector('a').click(); assert.deepEqual(opened, ["signup"]);
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

test("nested feed scrolling triggers the prompt, but scrolling the auth form does not", () => {
  const { dom, doc, opened } = fixture();
  const cleanup = installGuestAuthTrigger(doc, mode => opened.push(mode));
  try {
    const modal = doc.querySelector('[data-guest-auth-dialog]');
    modal.scrollTop = 100; modal.dispatchEvent(new dom.window.Event('scroll'));
    assert.deepEqual(opened, []);
    const main = doc.querySelector('main');
    main.dispatchEvent(new dom.window.Event('scroll')); assert.deepEqual(opened, []);
    main.scrollTop = 20; main.dispatchEvent(new dom.window.Event('scroll'));
    assert.deepEqual(opened, ['signup']);
  } finally { cleanup(); dom.window.close(); }
});

test("cleanup removes the timer and capture listeners after authentication or navigation", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { dom, doc, opened } = fixture();
  const cleanup = installGuestAuthTrigger(doc, mode => opened.push(mode));
  cleanup();
  t.mock.timers.tick(10000);
  const event = new dom.window.Event('pointerdown', { bubbles: true, cancelable: true });
  doc.querySelector('main').dispatchEvent(event);
  assert.deepEqual(opened, []);
  assert.equal(event.defaultPrevented, false);
  dom.window.close();
});
