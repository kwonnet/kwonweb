"use client";
import { updateDisplayedPages } from "@/utils/post-reactions";
import { useCallback, useRef } from "react";
import type { FeedPost, SwrGenericMutateFunction } from "@/types";

// SWR fallbackData is rendered, but is not necessarily stored in the cache yet.
export default function useFeedCacheMutate(mutate: SwrGenericMutateFunction<FeedPost>, data?: FeedPost[][]) {
  const displayed = useRef(data);
  displayed.current = data;
  return useCallback(((update?: any, options?: any) => {
    if (update === undefined) return mutate();
    return mutate(typeof update === "function"
      ? (cached: FeedPost[][] | undefined) => updateDisplayedPages(cached, displayed.current, update)
      : update, options);
  }) as SwrGenericMutateFunction<FeedPost>, [mutate]);
}
