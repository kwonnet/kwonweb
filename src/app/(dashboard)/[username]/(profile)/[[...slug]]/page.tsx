import React, { Suspense } from "react";
import { getUserPostsFeed } from "@/lib/users";
import FeedSkeleton from "@/components/post/FeedSkeleton";
import PageClient from "./PageClient";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiUrl } from "@/config";
import { getServerSession } from "@/lib/server-session";
import { UserMiniProfile } from "@/types/user";
import { getUserConnInfo } from "@/utils/connections";

type URLParams = {
  username: string;
  slug: string[];
};

const page = async ({ params }: { params: Promise<URLParams> }) => {
  const _params = await params;

  const session = await getServerSession();

  const identifier = _params?.username?.replace("%40", "");

  if (!identifier) return <ErrorMessage message="Invalid user identifier" />;

  const result = await fetch(`${apiUrl}/users/${identifier}/overview`, {
    method: "GET",
    next: { revalidate: 60, tags: [`user-${identifier}`] },
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": `application/json`,
      Authorization: `Bearer ${session?.user?.accessToken}`,
    },
  });

  if (!result.ok) {
    const message = await result.text();
    return <ErrorMessage message={message} />;
  }

  const user: UserMiniProfile = await result.json();

    // check if target or current user block the other

  const isBlocked = (user?.actions?.hasBlockedUser || user?.actions?.isBlockedByUser) 

  if(isBlocked) return null 

  const slug = _params.slug ? _params.slug[0] : "posts";

  const { isConnected } = getUserConnInfo(user?.conn);

  const isCurrentUser = session?.user?.id === user.id;

  const isPrivate = user.meta.isPrivate;

  const isActive = user?.meta.isActive;

  const canView =
    (isPrivate && isConnected) || (isActive && !isPrivate) || isCurrentUser;

  if(!canView) return null

  const allowed = ["posts", "replies", "media", ...(user.meta.isPro ? ["highlights"] : []), ...(isCurrentUser ? ["scheduled", "likes", "bookmarks"] : [])];
  const kind = allowed.includes(slug) ? slug : "posts";
  async function ProfileFeed() {
    // Stream the profile header while fetching the active tab on the server.
    // No persistent cache here: visibility and reactions must use current authorization.
    const posts = await getUserPostsFeed({ userId: user.id, kind, page: 1, limit: 21 }, session?.user?.accessToken).catch(() => undefined);
    return <PageClient slug={kind} user={user} posts={posts} />;
  }
  return <Suspense fallback={<FeedSkeleton />}><ProfileFeed /></Suspense>;
};

export default page;
