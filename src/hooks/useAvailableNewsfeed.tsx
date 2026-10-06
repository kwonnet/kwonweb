'use client';
import {useEffect, useRef, useState} from 'react';
import {getAvailableNewsfeedPosts} from '@/lib/posts';
import type {FeedPost} from '@/types';

/** Keep new posts pending until explicitly consumed; one stream for the mounted tab. */
export default function useAvailableNewsfeed({feed, userId, token, posts, since, enabled, apply}: {
  feed: string; userId?: string; token?: string; posts: FeedPost[]; since?: string; enabled: boolean;
  apply: (posts: FeedPost[]) => Promise<void>;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const seen = useRef(new Set(posts.map(post => post.id)));
  const busy = useRef(false);
  const generation = useRef(0);
  useEffect(() => {for (const post of posts) seen.current.add(post.id);}, [posts]);
  useEffect(() => {
    if (!enabled || !userId || !token) return;
    generation.current += 1;
    const source = new EventSource(`/api/events?${new URLSearchParams({feed, since: since ?? new Date().toISOString()})}`);
    const receive = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.feed !== feed || !Array.isArray(payload.ids)) return;
        const next = payload.ids.filter((id: unknown): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id) && !seen.current.has(id));
        setIds([...new Set<string>(next)].slice(0,50));
      } catch { /* Ignore malformed events; reconnection remains automatic. */ }
    };
    source.addEventListener('feed_available', receive as EventListener);
    return () => {generation.current += 1;source.removeEventListener('feed_available', receive as EventListener);source.close();};
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
  return {count: ids.filter(id => !displayed.has(id)).length, loading, error, consume};
}
