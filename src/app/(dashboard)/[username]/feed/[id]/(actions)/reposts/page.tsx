import {pageMetadata} from '@/lib/seo';
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

  if (!result.ok) return <ErrorMessage message={await result.text()} />;
  const users: UserConnection[] = result.ok ? await result.json() : [];


  return (
    <PageClient
      postId={args.id}
      users={users}
    />
  );
};

export default PageServer;

export async function generateMetadata({params}: {params: Promise<{username: string; id: string}>}) {
  const p = await params;
  return pageMetadata('Post reposts', 'View post reposts on Kwonnet.', "/" + encodeURIComponent(p.username) + "/" + 'feed' + "/" + encodeURIComponent(p.id) + "/" + 'reposts', false);
}
