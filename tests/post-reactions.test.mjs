import test from 'node:test';
import assert from 'node:assert/strict';
import { updateReaction, runReaction, isReactionPending, updateDisplayedPages } from '../src/utils/post-reactions.ts';
import { newsfeedKey } from '../src/utils/newsfeed-key.ts';
import { unstable_serialize } from 'swr';
const post = () => ({ id: 'p', totalLikes: 5, totalBookmarks: 2, totalReposts: 1, actions: { hasLiked: false, hasSaved: false, hasReposted: false } });

test('first reaction updates server fallback before SWR has cached any pages', () => {
  const displayed = [[post()]];
  const updated = updateDisplayedPages(undefined, displayed, pages => pages.map(page => page.map(p => updateReaction(p, 'p', 'like', true))));
  assert.equal(updated[0][0].actions.hasLiked, true);
  assert.equal(updated[0][0].totalLikes, 6);
  assert.equal(displayed[0][0].totalLikes, 5);
});
test('cached data wins over older server fallback', () => {
  const updated = updateDisplayedPages([[{ ...post(), totalLikes: 10 }]], [[post()]], pages => pages.map(page => page.map(p => updateReaction(p, 'p', 'like', true))));
  assert.equal(updated[0][0].totalLikes, 11);
});
for (const [kind, flag, count] of [['like','hasLiked','totalLikes'], ['bookmark','hasSaved','totalBookmarks'], ['repost','hasReposted','totalReposts']]) {
  test(`${kind} applies once, including repeated confirmations and embedded reposts`, () => {
    const original = post();
    const selected = updateReaction(original, 'p', kind, true);
    const duplicate = updateReaction(selected, 'p', kind, true);
    assert.equal(duplicate[count], original[count] + 1);
    assert.equal(duplicate.actions[flag], true);
    const undone = updateReaction(duplicate, 'p', kind, false);
    assert.equal(undone[count], original[count]);
    const wrapper = { id: 'repost', parent: { id: 'nested', parent: original } };
    assert.equal(updateReaction(wrapper, 'p', kind, true).parent.parent.actions[flag], true);
    assert.equal(original.actions[flag], false);
    assert.equal(updateReaction({ ...selected, [count]: 0 }, 'p', kind, false)[count], 0);
  });
}
test('other users reactions affect counts without changing the viewer selection', () => {
  const original = post();
  const result = updateReaction(original, 'p', 'like', true, false);
  assert.equal(result.totalLikes, 6);
  assert.equal(result.actions.hasLiked, false);
  assert.equal(updateReaction(original, 'unrelated', 'like', true), original);
});
test('rapid repeated clicks send only one toggle; UI changes before request resolves', async () => {
  let release;
  const wait = new Promise(resolve => { release = resolve; });
  let requests = 0;
  const selections = [];
  const request = () => { requests++; return wait; };
  const first = runReaction('u:like:p', true, value => selections.push(value), request);
  assert.deepEqual(selections, [true]);
  assert.equal(isReactionPending('u:like:p'), true);
  await runReaction('u:like:p', false, value => selections.push(value), request);
  assert.equal(requests, 1);
  release(); await first;
  assert.equal(isReactionPending('u:like:p'), false);
});
test('failed requests rollback selection and count and unlock retry', async () => {
  let value = post();
  const apply = selected => { value = updateReaction(value, 'p', 'like', selected); };
  await assert.rejects(runReaction('u:like:failed', true, apply, async () => { throw new Error('offline'); }));
  assert.deepEqual(value, post());
  await runReaction('u:like:failed', true, apply, async () => {});
  assert.equal(value.actions.hasLiked, true);
});
test('feed cache identifiers are separated by viewer and feed', () => {
  const key = unstable_serialize(newsfeedKey('alice', 'foryou', 0));
  assert.ok(key.includes('viewerId:"alice",'));
  assert.notEqual(key, unstable_serialize(newsfeedKey('bob', 'foryou', 0)));
  assert.notEqual(key, unstable_serialize(newsfeedKey('alice', 'following', 0)));
});
test('rolling back one action preserves a concurrent different reaction', async () => {
  let value = post();
  let reject;
  const response = new Promise((_, fail) => { reject = fail; });
  const failing = runReaction('u:like:concurrent', true, selected => { value = updateReaction(value, 'p', 'like', selected); }, () => response);
  await runReaction('u:bookmark:concurrent', true, selected => { value = updateReaction(value, 'p', 'bookmark', selected); }, async () => {});
  reject(new Error('offline'));
  await assert.rejects(failing);
  assert.equal(value.actions.hasLiked, false);
  assert.equal(value.totalLikes, 5);
  assert.equal(value.actions.hasSaved, true);
  assert.equal(value.totalBookmarks, 3);
});
