"use client";
import React from "react";
import Box from "@mui/material/Box";
import { FeedPost } from "@/types";
import dynamic from "next/dynamic";
import FeedSkeleton from "./FeedSkeleton";

const FeedsDisplay = dynamic(() => import("./FeedsDisplay"), {
  ssr: false, // Optional: disables server-side rendering
  loading: () => <FeedSkeleton items={10} height={100} /> // Optional fallback while loading
});

export default function FeedSection({ posts }: { posts: FeedPost[] }) {

  return (
    <Box sx={{ width: "100wv", mb: 1 }}>
      
      <FeedsDisplay posts={posts} />
    </Box>
  );
}
