"use client";
import React, { useState } from "react";
import { FeedPost, PostMedia } from "@/types";
import { getMobileScaledDimensions, isMobileScreenshot } from "@/utils";
import dynamic from "next/dynamic";
const MediaPreview = dynamic(() => import("./MediaPreview"), { ssr: false });
import { Box } from "@mui/material";
import { useInView } from "react-intersection-observer";
const VideoPlayer = dynamic(() => import("../common/VideoPlayer"), { ssr: false });

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
  const { ref, inView } = useInView({ rootMargin: "300px", triggerOnce: true });
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
      <Box ref={ref} onClick={(ev) => ev.stopPropagation()} sx={{ height: height ?? "auto", aspectRatio: height ? undefined : "16/9", backgroundColor: "#111" }}>
        {inView ? <VideoPlayer post={post} item={item} autoPlay={autoPlay} muted={muted} height={height} /> : <img src={item.thumbnailUrl} alt={item.altText || "Video preview"} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
        {state.open && <MediaPreview
          post={post}
          item={item}
          isOpen={state.open}
          toggleDrawer={toggleDrawer}
        />}
      </Box>
    </React.Fragment>
  );
};


export default VideoMediaItem;
