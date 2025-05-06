"use client";
import React, { useState } from "react";
import { FeedPost, PostMedia } from "@/types";
import { getMobileScaledDimensions, isMobileScreenshot } from "@/utils";
import MediaPreview from "./MediaPreview";
import { Box } from "@mui/material";
import { VideoPlayer } from "../common";

const VideoMediaItem = ({
  item,
  post,
  height,
  autoPlay = false,
  muted = true,
}: {
  item: PostMedia;
  post: FeedPost;
  height?: number;
  autoPlay?: boolean
  muted?: boolean;
}) => {
  const [state, setState] = useState({ open: false });

  const toggleDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    ev.stopPropagation();
    setState((prev) => ({ ...prev, open }));
  };

  const isMobile = isMobileScreenshot(item.width, item.height);

  const dim = getMobileScaledDimensions(item.width, item.height, 400, 200);

  const handlePreview = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    toggleDrawer(ev, true);
  };

  return (
    <React.Fragment>
      <Box onClick={(ev) => ev.stopPropagation()}>
        <VideoPlayer post={post} item={item} autoPlay={autoPlay} muted={muted} height={height} />
        <MediaPreview
          post={post}
          item={item}
          isOpen={state.open}
          toggleDrawer={toggleDrawer}
        />
      </Box>
    </React.Fragment>
  );
};


export default VideoMediaItem;
