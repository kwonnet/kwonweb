"use client";
import { FeedPost, PostMedia } from "@/types";
import { Box, CardMedia, useMediaQuery, useTheme } from "@mui/material";
import React, { memo, useState } from "react";
import dynamic from "next/dynamic";
const MediaPreview = dynamic(() => import("./MediaPreview"), { ssr: false });
import { getSessionId, isMobileScreenshot, shouldSendLog } from "@/utils";
import { PostMediaAction, PostMediaKind, PostMediaLog } from "@/types/post";
import { sendPostLog } from "@/lib/posts";
import { useAuthSession } from "@/hooks";


const CardMediaItem = ({
  item,
  toggle,
  height = 250,
  disablePadding = true,
}: {
  height?: number;
  item: PostMedia;
  disablePadding?: boolean;
  toggle: (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) => {
  const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isScreenshot = isMobileScreenshot(item.width, item.height)
  
  return (
    <Box sx={{ px: disablePadding ? 0 : 0.5, width: "100%", position: "relative" }}>
      <Box
        sx={{
          maxHeight: `${height}px`,
          width: "100%",
          position: "relative",
          overflow: "hidden",
          borderRadius: 2,
        }}
        onClick={(ev) => toggle(ev)}
      >
        <CardMedia
          component={"img"}
          image={item.url}
          alt={item.altText}
          sx={{
            display: "block",
            position: "relative",
            width: "100%",
            height: isMobile && isScreenshot ? "100%" :  item.height > height ? `${height}px` :  "100%",
            minHeight: item.height > height ? `${height}px` : "100%",
            zIndex: 9,
            objectFit: "cover",
            objectPosition: (!isMobile || (isMobile && isScreenshot)) ? "top center" : null,
          }}
        />
      </Box>
    </Box>
  );
};

const FeedMediaItem = memo(
  ({
    item,
    post,
    isSingle,
    height = 250,
    disablePadding,
    preview
  }: {
    post: FeedPost;
    item: PostMedia;
    isSingle: boolean;
    height?: number;
    disablePadding?: boolean;
    preview?: boolean
  }) => {
    const [state, setState] = useState({ open: false });

    const { token, user } = useAuthSession()

    const toggleDrawer = (ev: any, open: boolean) => {
      ev.preventDefault();
      ev.stopPropagation();
      setState((prev) => ({ ...prev, open }));
      const sessionId = getSessionId()
      const shouldSend = shouldSendLog(item.id, "MEDIA_IMAGE_VIEW")
      const payload: PostMediaLog = {
        action: PostMediaAction.VIEW,
        kind: PostMediaKind.IMAGE,
        mediaId: item.id,
        postId: post.id,
        muted: true,
        duration: 0,
        playbackRate: 0,
        timestamp: new Date().toISOString(),
        watchedPct: 0,
        sessionId,
      }
      if(open && shouldSend && post.userId !== user.id){
        sendPostLog(payload, token)
      }
    };

    return (
      <React.Fragment>
        <CardMediaItem
          disablePadding={disablePadding}
          height={height}
          item={item}
          toggle={(ev) => preview ? toggleDrawer(ev, true) : {}}
        />
        {state.open && <MediaPreview
          item={item}
          post={post}
          isOpen={state.open}
          toggleDrawer={toggleDrawer}
        />}
      </React.Fragment>
    );
  }
);

FeedMediaItem.displayName = "FeedMediaItem";

export default FeedMediaItem;
