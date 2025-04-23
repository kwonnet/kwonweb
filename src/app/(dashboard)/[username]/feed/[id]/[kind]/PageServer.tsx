import { auth } from "@/auth";
import { ErrorMessage } from "@/components/common";
import { apiUrl } from "@/config";
import { FeedPost } from "@/types";
import React from "react";
import PageClient from "./PageClient";
import QuotesClient from "./QuotesClient";
import { RepostsClient } from "./RepostsClient";

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
    `${apiUrl}/posts/${args.id}/quotes?limit=${21}&d=${date.getTime()}`,
    {
      method: "GET",
      next: { revalidate: 60, tags: [`posts_${args.id}_quotes`] },
      credentials: "include",
      mode: "cors",
      headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
    }
  );

  const result2 = await fetch(
    `${apiUrl}/posts/${args.id}/reposts?limit=${21}&d=${date.getTime()}`,
    {
      method: "GET",
      next: { revalidate: 60, tags: [`posts_${args.id}_reposts`] },
      credentials: "include",
      mode: "cors",
      headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
    }
  );

  const posts: FeedPost[] = result.ok ? await result.json() : [];

  const reposts = result2.ok ? await result2.json() : [];

  console.log(reposts, "reposts")

  return (
    <PageClient
      params={args}
      QuotesNode={<QuotesClient posts={posts} postId={args.id} />}
      RepostsNode={<RepostsClient users={reposts} postId={args.id} />}
    />
  );
};

export default PageServer;
