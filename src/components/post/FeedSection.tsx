"use client";
import Box from "@mui/material/Box";
import type { FeedPost } from "@/types";
import type { FeedTypeEnum } from "@/types/post";
import FeedsDisplay from "./FeedsDisplay";

export default function FeedSection({ posts, feed }: { posts: FeedPost[]; feed: FeedTypeEnum }) {
  return <Box sx={{ mb: 1 }}><FeedsDisplay posts={posts} feed={feed} /></Box>;
}
