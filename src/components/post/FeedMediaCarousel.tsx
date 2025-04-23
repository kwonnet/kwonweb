"use client";
import React, { useRef } from "react";
import FeedMediaItem from "./FeedMediaItem";
import { PostMedia } from "@/types";
import VideoMediaItem from "./VideoMediaItem";
import { Box, IconButton, Stack, useMediaQuery, useTheme } from "@mui/material";
import Slider from "react-slick";
import ArrowForwardIosOutlinedIcon from "@mui/icons-material/ArrowForwardIosOutlined";
import ArrowBackIosNewOutlinedIcon from "@mui/icons-material/ArrowBackIosNewOutlined";

const FeedMediaCarousel = ({ media }: { media: PostMedia[] }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const sliderRef = useRef<Slider | null>(null);
  return (
    <Box sx={{ maxWidth: "100%", position: "relative" }}>
      
      <Box style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
      <Slider
        ref={sliderRef}
        {...{
          autoplay: false,
          dots: false,
          infinite: true,
          speed: 500,
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: true,
          centerMode: false,
          vertical: true,
          verticalSwiping: true,
        }}
      >
        {media.map((item) => item.fileType.startsWith("image") ? (
          <Box sx={{px: 0.5, }} key={item.id}>
            <FeedMediaItem
            height={isMobile ? 200 : 360}
            item={item}
            isSingle={false}
          />
          </Box>): (
            <VideoMediaItem key={item.id} item={item} height={150} />
          )
          
        )}
      </Slider>
      </Box>
    </Box>)
}

export default FeedMediaCarousel;
