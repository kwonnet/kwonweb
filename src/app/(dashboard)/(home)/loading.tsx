"use client";
import { usePathname } from "next/navigation";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useAuthSession } from "@/hooks";
import { FeedTypeEnum } from "@/types/post";
import FeedSkeleton from "@/components/post/FeedSkeleton";
import FeedsDisplay from "@/components/post/FeedsDisplay";
import { newsfeedKey } from "@/utils/newsfeed-key";

// Keep a previously visited feed visible while its server route is streaming.
export default function Loading() {
  const { user } = useAuthSession();
  const pathname = usePathname();
  const { cache } = useSWRConfig();
  const segment = pathname.split("/")[1];
  const feed = Object.values(FeedTypeEnum).includes(segment as FeedTypeEnum) ? segment as FeedTypeEnum : FeedTypeEnum.FORYOU;
  const pages = user?.id ? cache.get(unstable_serialize(index => newsfeedKey(user.id, feed, index)))?.data : undefined;
  if (pages?.length) return <FeedsDisplay posts={pages[0]} feed={feed} />;
  return <div role="status" aria-label="Loading feed" aria-busy="true"><FeedSkeleton height={100} /></div>;
}
