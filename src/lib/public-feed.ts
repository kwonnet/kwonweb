import "server-only";
import { cache } from "react";
import { apiUrl } from "@/config";
import type { PublicPostPreview } from "@/utils/public-feed";

/** Share one public request between the server-rendered feed and its sidebar. */
export const getPublicFeed = cache(async (): Promise<{ posts: PublicPostPreview[]; unavailable: boolean }> => {
  try {
    const response = await fetch(`${apiUrl}/posts/preview`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (response.ok) {
      const posts = await response.json();
      if (Array.isArray(posts)) return { posts, unavailable: false };
    }
  } catch { /* Render the normal shell with an honest feed error. */ }
  return { posts: [], unavailable: true };
});
