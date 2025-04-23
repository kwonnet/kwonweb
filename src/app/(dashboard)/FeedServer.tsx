import { auth } from "@/auth";
import { FeedSection } from "@/components/common";
import { apiUrl } from "@/config";
import { FeedPost } from "@/types";
import { FeedTypeEnum } from "@/types/post";
import { Typography } from "@mui/material";
import React from "react";

const FeedServer = async () => {
  const session = await auth();
  const result = await fetch(`${apiUrl}/posts/feed/${FeedTypeEnum.FORYOU}`, {
    cache: "no-store",
    method: "GET",
    credentials: "include",
    mode: "cors",
    next: { revalidate: 0, tags: [FeedTypeEnum.FORYOU] },
    headers: {
      Authorization: `Bearer ${session?.user?.accessToken}`,

    },
  });
  // console.log(await result.text())
  if (!result.ok)
    return <Typography>Sorry an error occurred, trying to get feed</Typography>;
  const data: FeedPost[] = await result.json();
  return <FeedSection posts={data} />;
};

export default FeedServer;
