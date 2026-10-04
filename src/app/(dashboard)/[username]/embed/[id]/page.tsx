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
    next: { revalidate: 60, tags: [`post-${id}`] },
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