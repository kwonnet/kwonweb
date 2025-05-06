import { auth } from "@/auth";
import { ErrorMessage } from "@/components/common";
import { apiUrl } from "@/config";
import { FeedPostDetail } from "@/types";
import React from "react";
import PageClient from "./PageClient";

const PageServer = async ({ id }: { id?: string }) => {
  
  const date = new Date();

  const session = await auth();

  if (!id) return <ErrorMessage message="Error: post not found" />;

  const result = await fetch(`${apiUrl}/posts/${id}?d=${date.getTime()}`, {
    method: "GET",
    next: { revalidate: 0, tags: [`post-${id}`] },
    credentials: "include",
    mode: "cors",
    headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
  });

  if (!result.ok){
    return <ErrorMessage message="Error: Fetching post details" />;
  }

  const post: FeedPostDetail = await result.json();

  return <PageClient post={post} />;
};

export default PageServer;
