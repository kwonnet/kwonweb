"use client";
import { PostMedia } from "@/types";
import {
  Box,
  CardMedia} from "@mui/material";
import React, { memo, useState } from "react";
import MediaPreview from "./MediaPreview";
import { isMobileScreenshot } from "@/utils";



const FeedMediaItem = memo(({
  item,
  isSingle,
  height = 250
}: {
  item: PostMedia;
  isSingle: boolean;
  height?: number;

}) => {

  
    const [state, setState] = useState({open: false});
  
    const toggleDrawer = (ev: any, open: boolean) => {
      ev.preventDefault();
      ev.stopPropagation();
      setState((prev) => ({...prev, open }));
    }

    const isMobile = isMobileScreenshot(item.width, item.height)
  return (
    <React.Fragment>        
      <Box
        sx={{
          py: 0.5,
          display: "block",
        }}
        onClick={(ev) => toggleDrawer(ev, true)}
      >
        <CardMedia
          height={height}
          component={"img"}
          src={item.url}
          alt={item.altText}
          sx={{
            cursor: "pointer",
            borderRadius: isSingle ? 3.5 : 5,
            position: "relative",
            display: "block",
            minWidth: isSingle ? "100%" : "auto",
            width: "100%", //isSingle ? "auto" : 150,
            maxWidth: "100%",
            objectFit: isMobile ? "contain" : "cover",
            objectPosition: "50% 50%"
          }}
        />
      </Box>
      <MediaPreview
        media={item}
        isOpen={state.open}
        toggleDrawer={toggleDrawer}
      />
    </React.Fragment>
  );
});

export default FeedMediaItem
