"use client";
import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";

export default function useLoadMore(loadMore: () => void, enabled = true, rootMargin = "0px") {
  const { ref, inView } = useInView({ threshold: 0, rootMargin, fallbackInView: false });
  const callback = useRef(loadMore);
  callback.current = loadMore;
  // Callback identity changes must not keep queuing requests while the marker is visible.
  useEffect(() => {
    if (inView && enabled) callback.current();
  }, [inView, enabled]);
  return ref;
}
