"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { FeedPost } from "@/types";
import dynamic from "next/dynamic";
import FeedSkeleton from "./FeedSkeleton";
import { FeedTypeEnum } from "@/types/post";
import { FeedIndicator } from "../common";
import { useScrollTop } from "@/hooks";
import { useInView } from "react-intersection-observer";

const FeedsDisplay = dynamic(() => import("./FeedsDisplay"), {
  ssr: false, // Optional: disables server-side rendering
  loading: () => <FeedSkeleton items={10} height={100} /> // Optional fallback while loading
});

export default function FeedSection({ posts, feed }: { posts: FeedPost[], feed: FeedTypeEnum }) {
  const { ref, inView } = useInView({ threshold: 0.7, fallbackInView: true });

  const pendingCount = 30
  const showIndicator = pendingCount > 0 && !inView;
  return (
    <Box sx={{ mb: 1, }}>
      <Box ref={ref} />
      <Box
        sx={{
          position: "fixed",
          top: 80,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 1300,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 600,        // SAME as feed column
            display: "flex",
            justifyContent: "center",
          }}
        >
          <FeedIndicator
            visible={showIndicator}
            count={pendingCount}
            onClick={() => {
              // scroll to top
            }}
          />
        </Box>
      </Box>

      <FeedsDisplay posts={posts} feed={feed} />
    </Box>
  );
}
