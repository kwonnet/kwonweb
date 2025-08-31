import React from "react";
import {DisplayError} from "@/components/common";
import { auth } from "@/auth";
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

  const session = await auth();

  if (!id) return <DisplayError status={500} message="Error: post not found" />;

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
