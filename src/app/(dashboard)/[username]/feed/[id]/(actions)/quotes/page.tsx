import { auth } from "@/auth";
import { ErrorMessage } from "@/components/common";
import { apiUrl } from "@/config";
import { FeedPost } from "@/types";
import React from "react";
import PageClient from "./PageClient";

type URLParams = {
  kind: string;
  username: string;
  id: string;
};
const Page = async ({ params }: { params: Promise<URLParams> }) => {
  const date = new Date();

  const session = await auth();

  const args = await params

  if (!args.id) return <ErrorMessage message="Error: post not found" />;

  const result = await fetch(
    `${apiUrl}/posts/${args.id}/quotes?limit=${21}&d=${date.getTime()}`,
    {
      method: "GET",
      next: { revalidate: 60, tags: [`posts_${args.id}_quotes`] },
      credentials: "include",
      mode: "cors",
      headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
    }
  );

  const posts: FeedPost[] = result.ok ? await result.json() : [];

  return (
    <PageClient
      postId={args.id}
      posts={posts}
    />
  );
};

export default Page;
