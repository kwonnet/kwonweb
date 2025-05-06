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
const PageServer = async ({ args }: { args: URLParams }) => {
  const date = new Date();

  const session = await auth();

  if (!args.id) return <ErrorMessage message="Error: post not found" />;

  const result = await fetch(
    `${apiUrl}/posts/${args.id}/replies?hidden=true&limit=${21}&d=${date.getTime()}`,
    {
      method: "GET",
      next: { revalidate: 60, tags: [`posts_${args.id}_hidden_replies`] },
      credentials: "include",
      mode: "cors",
      headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
    }
  );

  const posts: FeedPost[] = result.ok ? await result.json() : [];

  return (<PageClient postId={args.id} posts={posts} />);
};

export default PageServer;
