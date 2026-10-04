import React from "react";
import { getServerSession } from "@/lib/server-session";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiUrl } from "@/config";
import { FeedPost } from "@/types";
import PageClient from "./PageClient";

type URLParams = {
  kind: string;
  username: string;
  id: string;
};

type SearchParams = {
  u: string;
};
const page = async ({
  params,
}: {
  params: Promise<URLParams>;
  searchParams: Promise<SearchParams>;
}) => {
  const args = await params;
  const date = new Date();

  const session = await getServerSession();

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

  return (
    <React.Fragment>
      <PageClient postId={args.id} posts={posts} />
    </React.Fragment>
  );
};

export default page;
