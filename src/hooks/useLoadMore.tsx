"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { debounce } from "lodash";

export default function useLoadMore(loadMore: () => void) {
  const { ref, inView } = useInView({ threshold: 0.1, fallbackInView: true });
  useEffect(() => {
    const debounced = debounce(loadMore, 100)
    if (inView) {
        console.log("loadmore called in useLoadMore hook")
        debounced()
    }
  }, [inView]);

  return ref;
}

