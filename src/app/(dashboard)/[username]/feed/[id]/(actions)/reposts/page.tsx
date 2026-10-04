import { getServerSession } from "@/lib/server-session";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiUrl } from "@/config";
import { FeedPost, PostAuthor } from "@/types";
import React from "react";
import PageClient from "./PageClient";
import { UserConnection } from "@/types/user";


type URLParams = {
  kind: string;
  username: string;
  id: string;
};
const PageServer = async ({ params }: { params: Promise<URLParams> }) => {
  
  const date = new Date();

  const session = await getServerSession();

  const args = await params

  if (!args.id) return <ErrorMessage message="Error: post not found" />;

  const result = await fetch(
    `${apiUrl}/posts/${args.id}/reposts?limit=${21}&d=${date.getTime()}`,
    {
      method: "GET",
      next: { revalidate: 60, tags: [`posts_${args.id}_reposts`] },
      credentials: "include",
      mode: "cors",
      headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
    }
  );

  const users: UserConnection[] = result.ok ? await result.json() : [];


  return (
    <PageClient
      postId={args.id}
      users={users}
    />
  );
};

export default PageServer;
