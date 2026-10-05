const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
function load(path, dependencies = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(id => id in dependencies ? dependencies[id] : require(id), module, module.exports);
  return module.exports;
}
test('trend and hashtag search URLs preserve Unicode, spaces and query punctuation safely', () => {
  const { searchHref, tokenizePostText } = load('src/utils/post-text.ts');
  const query = '#naïve & solar?';
  const url = new URL(searchHref(query), 'https://kwonnet.test');
  assert.equal(url.pathname, '/search'); assert.equal(url.searchParams.get('q'), query);
  assert.equal(url.searchParams.get('src'), 'trend_click'); assert.equal(url.searchParams.get('tab'), 'top');
  const hashtag = tokenizePostText('#naïve')[0];
  assert.equal(new URL(hashtag.href, url).searchParams.get('q'), '#naïve');
});
test('profile cache updates own identity in nested feed pages and linked accounts without changing other authors or reactions', () => {
  const { updateProfileCache } = load('src/utils/profile-cache.ts');
  const own = { id: 'u', username: 'old', name: 'Old', avatar: 'old.png' };
  const other = { id: 'other', username: 'other', avatar: 'other.png' };
  const card = { id: 'post', author: other, parent: { author: own }, actions: { liked: true } };
  const profile = { id: 'u', name: 'New', username: 'new', avatar: 'new.png', banner: 'new-banner.png', bio: 'New bio' };
  const data = [[card]];
  const next = updateProfileCache(data, profile);
  assert.equal(next[0][0].parent.author.avatar, 'new.png'); assert.equal(next[0][0].parent.author.username, 'new');
  assert.equal(next[0][0].author, other); assert.equal(next[0][0].actions, card.actions); assert.equal(own.avatar, 'old.png');
  assert.equal(updateProfileCache([other], profile)[0], other);
  assert.equal(updateProfileCache([{ ...own, image: 'old.png', banner: 'old' }], profile)[0].image, 'new.png');
});
test('search server renders seeded API results and forwards the authenticated token to the selected tab', async () => {
  const calls = [];
  const Page = load('src/app/(dashboard)/search/page.tsx', {
    '@/lib/server-session': { getServerSession: async () => ({ user: { id: 'viewer', accessToken: 'token' } }) },
    '@/lib/posts': { searchPosts: async (...args) => { calls.push(['posts', ...args]); return { posts: [{ id: 'p' }] }; } },
    '@/lib/users': { searchUsers: async (...args) => { calls.push(['people', ...args]); return [{ id: 'u' }]; } },
    './SearchClient': { __esModule: true, default: () => null },
  }).default;
  const latest = await Page({ searchParams: Promise.resolve({ q: 'Solar Energy', tab: 'latest' }) });
  assert.equal(latest.props.posts[0].id, 'p'); assert.equal(latest.props.failed, false);
  assert.deepEqual(calls[0], ['posts', { q: 'Solar Energy', tab: 'latest' }, 'token']);
  const people = await Page({ searchParams: Promise.resolve({ q: 'Ada', tab: 'people' }) });
  assert.equal(people.props.people[0].id, 'u'); assert.equal(calls[1][0], 'people');
});
