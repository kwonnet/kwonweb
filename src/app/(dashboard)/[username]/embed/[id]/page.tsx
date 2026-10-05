import {postMetadata} from '@/lib/seo-data';
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiUrl } from '@/config';
import React from 'react'
import FeedCardItem from './FeedCardItem';
type URLParams = {
  id: string;
};

type SearchParams = {
  u: string;
}
const page = async({ params }: { params: Promise<URLParams>; searchParams: Promise<SearchParams> }) => {

  const { id } = await params

  if (!id) return <ErrorMessage message="Error: post not found" />;

  const result = await fetch(`${apiUrl}/posts/${id}/embed`, {
    method: "GET",
    cache: 'no-store',
    credentials: "include",
    mode: "cors",
  });

  if (!result.ok){
    return <ErrorMessage message="Error: Fetching post details" />;
  }

  const post = await result.json();

  return (<FeedCardItem post={post} />)
}

export default page
export async function generateMetadata({params}: {params: Promise<{username: string; id: string}>}) {
  const {username, id} = await params;
  return postMetadata(username, id, true);
}
