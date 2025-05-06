"use client";
import React from "react";
import { FeedPost, PostMedia } from "@/types";
import FeedMediaItem from "./FeedMediaItem";
import { Box, Grid, useMediaQuery, useTheme } from "@mui/material";
import FeedMediaCarousel from "./FeedMediaCarousel";
import VideoMediaItem from "./VideoMediaItem";



const DisplayFeedMedia = ({
  post,
  height,
  autoPlay = false,
  muted = true,
  preview = true
}: {
  autoPlay?: boolean;
  muted?: boolean;
  post: FeedPost;
  height?: number;
  preview?: boolean
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallDevice = useMediaQuery(theme.breakpoints.down("sm"));
  const media = post.media;
  if (media.length === 1) {
    const item = media[0];
    const isLandscape = item.width > item.height
    const itemHeight = (isMobile && isLandscape) ? 200 : (isSmallDevice && isLandscape) ? 120 : height ? height : 400
    return item.fileType.startsWith("image") ? (
      <FeedMediaItem
        height={itemHeight}
        post={post}
        item={item}
        isSingle={true}
        preview={preview}
      />
    ) : (
      <Box>
        {" "}
        <VideoMediaItem
          post={post}
          item={item}
          autoPlay={autoPlay}
          muted={muted}
          height={itemHeight}
        />{" "}
      </Box>
    );
  }

  if (media.length === 2) {
    const itemHeight = isMobile ? 120 : 200
    return (
      <Grid container spacing={1}>
        {media.map((item) => (
          <Grid key={item.id} size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
            {item.fileType.startsWith("image") ? (
              <FeedMediaItem
                post={post}
                height={ itemHeight }
                item={item}
                isSingle={true}
                preview={preview}
              />
            ) : (
              // <Box
              //   sx={{
              //     // py: 1,
              //     display: "block",
              //   }}
              // >
                <VideoMediaItem post={post} height={itemHeight} item={item} />
              // </Box>
            )}
          </Grid>
        ))}
      </Grid>
    );
  }
  return <FeedMediaCarousel preview={preview} post={post} media={media} />;
};

export default DisplayFeedMedia;