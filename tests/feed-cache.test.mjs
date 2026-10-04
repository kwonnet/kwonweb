import test from 'node:test';
import assert from 'node:assert/strict';
import { missingFeedEntries } from '../src/utils/seed-feed-cache.ts';

test('server posts seed both pagination and navigation without fetching again', () => {
  const posts = [{ id: 'p1' }];
  assert.deepEqual(missingFeedEntries(new Map(), 'viewer-page', 'viewer-list', posts), [
    ['viewer-page', posts], ['viewer-list', [posts]],
  ]);
});
test('return navigation preserves reacted posts and additional pages', () => {
  const pages = [[{ id: 'p1', liked: true }], [{ id: 'p2' }]];
  const cache = new Map([['list', { data: pages }]]);
  assert.deepEqual(missingFeedEntries(cache, 'page', 'list', [{ id: 'p1', liked: false }]), [['page', pages[0]]]);
  cache.set('page', { data: pages[0] });
  assert.deepEqual(missingFeedEntries(cache, 'page', 'list', []), []);
});
test('empty feeds are cached and viewer keys remain isolated', () => {
  const cache = new Map([['other-viewer-list', { data: [[{ id: 'private' }]] }]]);
  assert.deepEqual(missingFeedEntries(cache, 'page', 'list', []), [['page', []], ['list', [[]]]]);
});
