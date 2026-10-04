import { getServerSession } from "@/lib/server-session";
import { DisplayError, FeedSection } from "@/components/common";
import { apiUrl } from "@/config";
import { FeedPost } from "@/types";
import { FeedTypeEnum } from "@/types/post";
import React from "react";

const Page = async () => {
  const session = await getServerSession();
  const result = await fetch(
    `${apiUrl}/posts/feed/${FeedTypeEnum.FORYOU}?feed=${FeedTypeEnum.FORYOU}&limit=21&page=1`,
    {
      cache: "no-store",
      method: "GET",
      credentials: "include",
      mode: "cors",
      // next: { revalidate: 30, tags: [FeedTypeEnum.FORYOU] },
      headers: {
        Authorization: `Bearer ${session?.user?.accessToken}`,
      },
    }
  );
  if (!result.ok) {
    return (
      <DisplayError status={result.status} message={await result.text()} />)

  }

  const data: FeedPost[] = await result.json();

  return <FeedSection posts={data} feed={FeedTypeEnum.FORYOU} />;
};

export default Page;
