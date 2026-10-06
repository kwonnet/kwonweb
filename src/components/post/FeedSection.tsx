"use client";
import Box from "@mui/material/Box";
import type { FeedPost } from "@/types";
import type { FeedTypeEnum } from "@/types/post";
import FeedsDisplay from "./FeedsDisplay";
import {useAuthSession} from '@/hooks';

export default function FeedSection({ posts, feed, availableSince }: { posts: FeedPost[]; feed: FeedTypeEnum; availableSince?: string }) {
  const {user} = useAuthSession();
  return <Box sx={{ mb: 1 }}><FeedsDisplay key={`${user?.id}:${feed}`} posts={posts} feed={feed} availableSince={availableSince} /></Box>;
}
