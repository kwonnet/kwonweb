"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { debounce } from "lodash";

export default function useLoadMore(loadMore: () => void) {
  const { ref, inView } = useInView({ threshold: 0.01, fallbackInView: true });

  useEffect(() => {
    const debounced = debounce(loadMore, 10)
    if (inView) {
        console.log("load more called in useLoadMore hook")
        debounced()
    }
    return () => debounced.cancel();
  }, [inView, loadMore]);

  return ref;
}

