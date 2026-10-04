import "server-only";
import { performance } from "node:perf_hooks";
import { getServerSession } from "@/lib/server-session";
import { apiUrl } from "@/config";
import type { FeedPost } from "@/types";
import type { FeedTypeEnum } from "@/types/post";
import DisplayError from "@/components/common/DisplayError";
import FeedSection from "./FeedSection";
import GuestFeed, { type PublicPostPreview } from "./GuestFeed";

/** Stream real posts as soon as the API returns; sidebar requests remain independent. */
export default async function ServerFeed({ feed }: { feed: FeedTypeEnum }) {
  const started = performance.now();
  const session = await getServerSession();
  const authenticatedAt = performance.now();
  if (!session?.user?.accessToken) {
    // Only the home preview is public. Never downgrade other feeds to anonymous data.
    if (feed !== "foryou") return <DisplayError status={401} message="Please sign in to view your feed." />;
    let posts: PublicPostPreview[] = [];
    let unavailable = false;
    try {
      const response = await fetch(`${apiUrl}/posts/preview`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (response.ok) posts = await response.json();
      else unavailable = true;
    } catch {
      unavailable = true;
    }
    return <GuestFeed posts={posts} unavailable={unavailable} />;
  }

  const result = await fetch(`${apiUrl}/posts/feed/${feed}?feed=${feed}&limit=21&page=1`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${session.user.accessToken}` },
  });
  const payload = result.ok ? await result.json() as FeedPost[] : await result.text();
  // Timings only: never log the session, token, post bodies, or personalized URL.
  console.info(JSON.stringify({ event: "newsfeed_ssr", feed, status: result.status,
    sessionMs: Math.round(authenticatedAt - started),
    apiMs: Math.round(performance.now() - authenticatedAt),
    backendTiming: result.headers.get("server-timing"), source: result.headers.get("x-feed-source"),
  }));
  if (typeof payload === "string") return <DisplayError status={result.status} message={payload} />;
  return <FeedSection posts={payload} feed={feed} />;
}
