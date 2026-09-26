"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

export default function useScrollTop() {
  const { ref, inView } = useInView({ threshold: 0.5, fallbackInView: true });
  const [isNearTop, setIsNearTop] = useState(true)
  useEffect(() => {
    if (inView) {
      setIsNearTop(true)
    }
  }, [inView]);

  return { ref, isNearTop};
}

