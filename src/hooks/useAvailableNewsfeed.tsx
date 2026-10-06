'use client';
import {useEffect, useRef, useState} from 'react';
import {getAvailableNewsfeedPosts} from '@/lib/posts';
import type {FeedPost} from '@/types';
type AvailableAuthor = {postId: string; id: string; name: string; avatar: string|null};

/** Keep new posts pending until explicitly consumed; one stream for the mounted tab. */
export default function useAvailableNewsfeed({feed, userId, token, posts, since, enabled, apply}: {
  feed: string; userId?: string; token?: string; posts: FeedPost[]; since?: string; enabled: boolean;
  apply: (posts: FeedPost[]) => Promise<void>;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [authors, setAuthors] = useState<AvailableAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const seen = useRef(new Set(posts.map(post => post.id)));
  const busy = useRef(false);
  const generation = useRef(0);
  useEffect(() => {for (const post of posts) seen.current.add(post.id);}, [posts]);
  useEffect(() => {
    if (!enabled || !userId || !token) return;
    generation.current += 1;
    let source: EventSource|null = null;
    const baselineSince = since ?? new Date().toISOString();
    const receive = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.feed !== feed || !Array.isArray(payload.ids)) return;
        const next = payload.ids.filter((id: unknown): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id) && !seen.current.has(id));
        setIds([...new Set<string>(next)].slice(0,50));
        setAuthors(Array.isArray(payload.authors) ? payload.authors.filter((author: AvailableAuthor) =>
          author && next.includes(author.postId) && typeof author.id === 'string' && typeof author.name === 'string' &&
          (author.avatar === null || typeof author.avatar === 'string')).slice(0,50) : []);
      } catch { /* Ignore malformed events; reconnection remains automatic. */ }
    };
    const stop = () => {if (source) {source.removeEventListener('feed_available', receive as EventListener);source.close();source = null;}};
    const syncVisibility = () => {
      if (document.visibilityState === 'hidden') {stop();return;}
      if (!source) {
        source = new EventSource(`/api/events?${new URLSearchParams({feed, since: baselineSince, known: Array.from(seen.current).slice(-200).join(',')})}`);
        source.addEventListener('feed_available', receive as EventListener);
      }
    };
    document.addEventListener('visibilitychange', syncVisibility);
    syncVisibility();
    return () => {generation.current += 1;document.removeEventListener('visibilitychange', syncVisibility);stop();};
  }, [enabled, userId, token, feed, since]);
  async function consume() {
    if (!token || busy.current || !ids.length) return;
    busy.current = true;setLoading(true);setError(null);
    const snapshot = [...ids];
    const requestGeneration = generation.current;
    try {
      const incoming = await getAvailableNewsfeedPosts(feed, snapshot, token);
      if (requestGeneration !== generation.current) return;
      await apply(incoming);
      for (const id of snapshot) seen.current.add(id);
      setIds(current => current.filter(id => !seen.current.has(id)));
    } catch (reason) {if (requestGeneration === generation.current) setError(reason instanceof Error ? reason.message : 'Unable to load new posts.');}
    finally {busy.current = false;if (requestGeneration === generation.current) setLoading(false);}
  }
  const displayed = new Set(posts.map(post => post.id));
  const pending = new Set(ids.filter(id => !displayed.has(id)));
  const profiles = [...new Map(authors.filter(author => pending.has(author.postId)).map(author => [author.id, author])).values()].slice(0,3);
  return {count: pending.size, profiles, loading, error, consume};
}
