import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldRefreshAccessToken } from '../src/lib/auth-refresh-policy.ts';
import { tokenizePostText } from '../src/utils/post-text.ts';
const now = 1_800_000_000_000;
const jwt = claims => `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;

test('valid recently refreshed sessions do not perform a backend refresh on each render', () => {
  assert.equal(shouldRefreshAccessToken(jwt({ exp: now / 1000 + 86400, iat: now / 1000 }), now, now), false);
  assert.equal(shouldRefreshAccessToken(jwt({ exp: now / 1000 + 86400, iat: now / 1000 }), undefined, now), false);
});
test('refresh before expiry, on stale profile, and for invalid token metadata', () => {
  assert.equal(shouldRefreshAccessToken(jwt({ exp: now / 1000 + 59 }), now, now), true);
  assert.equal(shouldRefreshAccessToken(jwt({ exp: now / 1000 + 86400 }), now - 300000, now), true);
  for (const value of [null, '', 'invalid', jwt({}), jwt({ exp: 'forever' })]) {
    assert.equal(shouldRefreshAccessToken(value, now, now), true);
  }
});
test('plain feed renderer preserves text, Unicode, and newlines exactly', () => {
  const text = 'Hi @alice!\nMeet #Kwonnet and #naïve 😀 https://example.com/path?q=1&v=2.';
  const parts = tokenizePostText(text);
  assert.equal(parts.map(p => p.text).join(''), text);
  assert.deepEqual(parts.filter(p => p.href).map(p => p.href), [
    '/@alice', '/hashtags?tag=Kwonnet', '/hashtags?tag=na%C3%AFve', 'https://example.com/path?q=1&v=2'
  ]);
});
test('feed links do not turn scripts, HTML, or email addresses into unsafe links', () => {
  const text = '<script>alert(1)</script> javascript:alert(1) alice@example.com www.example.com';
  const parts = tokenizePostText(text);
  assert.equal(parts.map(p => p.text).join(''), text);
  assert.deepEqual(parts.filter(p => p.href), [{ text: 'www.example.com', href: 'https://www.example.com', external: true }]);
});
