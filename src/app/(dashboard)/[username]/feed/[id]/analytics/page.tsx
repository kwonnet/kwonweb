import React from "react";
import PageClient from "./PageClient";
import { DisplayError, ErrorMessage } from "@/components/common";
import { apiUrl } from "@/config";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AccountAnalytics } from "@/types/user";
import { FeedPostDetail } from "@/types";

const durationList = [
  { id: "3h", isPro: false },
  { id: "6h", isPro: false },
  { id: "12h", isPro: false },
  { id: "24h", isPro: false },
  { id: "3d", isPro: false },
  { id: "7d", isPro: false },
  { id: "14d", isPro: false },
  { id: "21d", isPro: false },
  { id: "30d", isPro: false },
  { id: "3M", isPro: true },
  { id: "6M", isPro: true },
  { id: "9M", isPro: true },
  { id: "12M", isPro: true },
  { id: "2y", isPro: true },
];

type URLParams = {
  username: string;
  id: string;
  slug: string[];
};

const page = async ({ params }: { params: Promise<URLParams> }) => {
  const _params = await params;

  const session = await auth();

  const identifier = _params?.username?.replace("%40", "");

  if (!session || !identifier || session?.user?.username !== identifier)
    return redirect("/");

  // get post details
  const result1 = await fetch(`${apiUrl}/posts/${_params.id}`, {
    method: "GET",
    next: { revalidate: 0, tags: [`post-${_params.id}`] },
    credentials: "include",
    mode: "cors",
    headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
  });

  if (!result1.ok) {
    return (
      <DisplayError status={result1.status} message={await result1.text()} />
    );
  }

  const post: FeedPostDetail = await result1.json();

  // get post analytics

  const user = session?.user;

  const result = await fetch(
    `${apiUrl}/posts/${_params?.id}/post-analytics?duration=3h`,
    {
      method: "GET",
      next: { revalidate: 60, tags: [`post-${_params.id}-analytics`] },
      credentials: "include",
      mode: "cors",
      headers: {
        "Content-Type": `application/json`,
        Authorization: `Bearer ${user?.accessToken}`,
      },
    }
  );

  if (!result.ok) {
    const message = await result.text();
    return <DisplayError status={result.status} message={message} />;
  }

  const analytics: AccountAnalytics[] = await result.json();

  const durationItems = user?.meta?.isPro
    ? durationList
    : durationList.filter((item) => !item.isPro);

  return (
    <PageClient
      post={post}
      postId={_params.id}
      analytics={analytics}
      durationItems={durationItems}
    />
  );
};

export default page;
