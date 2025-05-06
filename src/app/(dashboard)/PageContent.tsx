"use client";
import React, { useState } from "react";
import {
  Avatar,
  Box,
  Card,
  Stack,
  TextField,
} from "@mui/material";

import { TopUserStories } from "@/components/common";
import dynamic from "next/dynamic";
import { useAuthSession } from "@/hooks";

const CreatePostDrawer = dynamic(() => import("@/components/post/CreatePostDrawer"));

enum FeedTypeEnum {
  FORYOU = "FORYOU",
  FOLLOWING = "FOLLOWING",
  FRIENDS = "FRIENDS",
  LATEST = "LATEST",
}
export default function PageClient({FeedServer}: { FeedServer: React.ReactNode}) {

  const {  user } = useAuthSession()

  const [state, setState] = useState({
    isOpen: false,
    feedType: FeedTypeEnum.FORYOU,
  });

  const toggleDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    console.log(`toggleDrawer`, open)
    setState((prev) => ({ ...prev, isOpen: open }));
  };

  const toggleFeedType = (feedType: FeedTypeEnum) => {
    setState((prev) => ({ ...prev, feedType }));
  };
  //  console.log(session)
  return (
    <Box sx={{ px: 1 }}>
      {/* Content for the left section */}
      <Card elevation={0} sx={ [(theme) => ({
          p: 2, mb: 1,
          boxShadow: theme.shadows[1],
          ...theme.applyStyles("dark", {
            boxShadow: theme.shadows[8]
          })
        }),
      ]} >
        <Stack
          direction={"row"}
          alignItems={"center"}
          spacing={0.5}
          sx={{ pb: 1 }}
        >
          <Avatar src="/avatar.jpeg" alt={"user"} />
          <TextField
            // onFocus={(ev) => toggleDrawer(ev, true)}
            onClick={ev =>  toggleDrawer(ev, true)}
            size="small"
            placeholder={`${user?.name?.split(" ")[0]}, what's happening?`}
            fullWidth
            sx={{ borderRadius: 5 }}
            slotProps={{
              input: {
                type: "text",
                autoComplete: "off",
                style: {
                  borderRadius: 30,
                },
              },
            }}
          />
        </Stack>
        {/* <Divider variant="fullWidth" /> */}
      </Card>
      {/* top stories section */}
      <TopUserStories />
      {/* feed type */}
      {/* <FeedSection /> */}
      {FeedServer}
      {/* Generate a lot of content to demonstrate scrolling */}
      {/* {Array.from({ length: 50 }).map((_, index) => (
        <PostCard key={index} index={index} />
      ))} */}
      <CreatePostDrawer isOpen={state.isOpen} toggleDrawer={toggleDrawer} />
    </Box>
  );
}
