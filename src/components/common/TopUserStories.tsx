"use client";
import React, { useRef } from "react";
import {
  Avatar,
  Box,
  CardMedia,
  IconButton,
  Paper,
} from "@mui/material";

import Slider from "react-slick";
import ArrowForwardIosOutlinedIcon from "@mui/icons-material/ArrowForwardIosOutlined";
import ArrowBackIosNewOutlinedIcon from "@mui/icons-material/ArrowBackIosNewOutlined";

function TopUserStories() {
  var settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 4,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 5,
          slidesToScroll: 4,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 3,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2,
        },
      },
    ],
  };
  const sliderRef = useRef<Slider | null>(null);
  return (
    <Box sx={{ mx: 1, mb: 1, height: 200, position: "relative", cursor: "-webkit-grab" }}>
      <Box
        sx={{
          zIndex: 9,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          left: 10,
        }}
      >
        <IconButton
          sx={{ border: "1px solid grey" }}
          onClick={() => sliderRef?.current?.slickPrev()}
        >
          <ArrowBackIosNewOutlinedIcon />
        </IconButton>
      </Box>
      <Box
        sx={{
          zIndex: 9,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          right: 10,
        }}
      >
        <IconButton
          sx={{ border: "1px solid grey" }}
          onClick={() => sliderRef?.current?.slickNext()}
        >
          <ArrowForwardIosOutlinedIcon />
        </IconButton>
      </Box>
      <Slider
        ref={sliderRef}
        {...{
          ...settings,
          arrows: false,
          swipe: true,
        }}
      >
        {Array.from({ length: 50 }).map((_, index) => (
          <Box key={index}>
            <Paper
              key={index}
              elevation={3}
              sx={{
                borderRadius: 3,
                mb: 1,
                mx: 4,
                height: { lg: 200, md: 200, sm: 180, xs: 180 },
                width: { lg: 140, md: 140, sm: 110, xs: 110 },
                position: "relative",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  zIndex: 9,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Avatar src="/avatar.jpeg" alt={"user"} />
                {index + 1}
              </Box>
              <CardMedia
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  objectPosition: "50% 0",
                }}
                image="/story2.jpg"
                component={"img"}
              />
            </Paper>
          </Box>
        ))}
      </Slider>
    </Box>
  );
}

export default TopUserStories