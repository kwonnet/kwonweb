import { getServerSession } from "@/lib/server-session";
import { FeedSection } from "@/components/common";
import { apiUrl } from "@/config";
import { FeedPost } from "@/types";
import { FeedTypeEnum } from "@/types/post";
import { Box, CardMedia, Typography } from "@mui/material";
import React from "react";

const Page = async () => {
  const session = await getServerSession();
  const result = await fetch(`${apiUrl}/posts/feed/${FeedTypeEnum.FORYOU}?feed=${FeedTypeEnum.FORYOU}&limit=21&page=1`, {
    cache: "no-store",
    method: "GET",
    credentials: "include",
    mode: "cors",
    // next: { revalidate: 30, tags: [FeedTypeEnum.FORYOU] },
    headers: {
      Authorization: `Bearer ${session?.user?.accessToken}`,

    },
  });
  const isError404 = result.status === 404;
  if (!result.ok) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          overflow: "hidden",
          width: "100%",
        }}
      >
        <CardMedia
          component={"img"}
          image={"/no-data.svg"}
          sx={{ height: 300, width: 300 }}
        />
        <Typography>{!isError404 ? await result.text() : null} </Typography>
      </Box>
    );
  }
  const data: FeedPost[] = await result.json();
  return <FeedSection posts={data} feed={FeedTypeEnum.FORYOU} />;
};

export default Page;

