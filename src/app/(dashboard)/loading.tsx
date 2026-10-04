import FeedSkeleton from "@/components/post/FeedSkeleton";

export default function Loading() {
  return <div role="status" aria-label="Loading content"><FeedSkeleton rows={3} /></div>;
}
