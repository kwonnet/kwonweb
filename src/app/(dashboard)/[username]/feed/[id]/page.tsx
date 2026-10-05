import {notFound} from 'next/navigation';
import PublicPostCard from '../../embed/[id]/FeedCardItem';
import {postMetadata} from '@/lib/seo-data';
import React from "react";
import DisplayError from "@/components/common/DisplayError";
import { getServerSession } from "@/lib/server-session";
import { apiUrl } from "@/config";
import { FeedPostDetail } from "@/types";
import PageClient from "./PageClient";

type URLParams = {
  id: string;
};

type SearchParams = {
  u: string;
};

const Page = async ({
  params,
}: {
  params: Promise<URLParams>;
  searchParams: Promise<SearchParams>;
}) => {
  const { id } = await params;

  const date = new Date();

  const session = await getServerSession();

  if (!id) return <DisplayError status={500} message="Error: post not found" />;

  if (!session?.user?.accessToken) {
    let response: Response;
    try {response = await fetch(`${apiUrl}/posts/${encodeURIComponent(id)}/embed`, {cache: 'no-store', signal: AbortSignal.timeout(5000)});} catch {return <DisplayError status={503} message="Post temporarily unavailable" />;}
    if (response.status === 404) notFound();
    if (!response.ok) return <DisplayError status={response.status} message="Post unavailable" />;
    return <PublicPostCard post={await response.json()} />;
  }
  const result = await fetch(`${apiUrl}/posts/${id}?d=${date.getTime()}`, {
    method: "GET",
    next: { revalidate: 0, tags: [`post-${id}`] },
    credentials: "include",
    mode: "cors",
    headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
  });

  if (!result.ok){
    return <DisplayError status={result.status} message={await result.text()}/>;
  }

  const post: FeedPostDetail = await result.json();  

  return (
    <React.Fragment>
      <PageClient post={post} />
    </React.Fragment>
  );
};

export default Page;

export async function generateMetadata({params}: {params: Promise<{username: string; id: string}>}) {
  const {username, id} = await params;
  return postMetadata(username, id, false);
}
