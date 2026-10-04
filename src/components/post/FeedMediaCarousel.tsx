"use client";
import React, { useRef } from "react";
import FeedMediaItem from "./FeedMediaItem";
import { FeedPost, PostMedia } from "@/types";
import VideoMediaItem from "./VideoMediaItem";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import Slider from "react-slick";

const FeedMediaCarousel = ({
  media,
  post,
  preview = true
}: {
  media: PostMedia[];
  post: FeedPost;
  preview?: boolean
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallDevice = useMediaQuery(theme.breakpoints.down("sm"));
  const height = (isMobile ? 180 : 320);

  const sliderRef = useRef<Slider | null>(null);
  return (
    <Box sx={{ width: "100%", position: "relative", px: 4 }}>
      <Box
        sx={{
          maxWidth: "100%",
          position: "relative",
          // px: 1,
          // paddingRight: "65px",
          // overflow: "hidden"
          width: "100%",
          height: "100%",
        }}
      >
        <Slider
          ref={sliderRef}
          {...{
            autoplay: false,
            // Cloned slides would mount extra players for the same video.
            infinite: !media.some(item => item.fileType.startsWith("video")),
            speed: 500,
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: true,
            centerMode: isMobile ? false : true,
            vertical: false,
            verticalSwiping: false,
            swipeToSlide: true,
            dots: false,
            responsive: [
              {
                breakpoint: 768, // hide arrows for screen width < 768px
                settings: {
                  arrows: false,
                },
              },
            ],
          }}
        >
          {media.map((item) =>
            item.fileType.startsWith("image") ? (
              <FeedMediaItem
                height={height}
                item={item}
                isSingle={false}
                key={item.id}
                post={post}
                disablePadding={false}
                preview={preview}
              />
            ) : (
              <VideoMediaItem
                key={item.id}
                post={post}
                item={item}
                height={height}
              />
            )
          )}
        </Slider>
      </Box>
    </Box>
  );
};

export default FeedMediaCarousel;
