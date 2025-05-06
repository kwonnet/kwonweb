"use client";
import React, { useEffect, useRef } from "react";
import MediaItem from "./MediaItem";
import Slider from "react-slick";
import { Box, IconButton } from "@mui/material";
import ArrowForwardIosOutlinedIcon from "@mui/icons-material/ArrowForwardIosOutlined";
import ArrowBackIosNewOutlinedIcon from "@mui/icons-material/ArrowBackIosNewOutlined";
import { PostThread } from "@/types/post";

const CarouselContainer = ({
  removeFileItem,
  onUpdateFileAltText,
  onUpdateFileFlags,
  onUpdatePostFile,
  item,
}: {
  removeFileItem: (threadId: number, id: string) => void;
  onUpdateFileAltText: (
    threadId: number,
    fileId: string,
    altText: string
  ) => void;
  onUpdateFileFlags: (
    threadId: number,
    fileId: string,
    flags: string[]
  ) => void;
  onUpdatePostFile: (threadId: number, fileId: string, file: File) => void;
  item: PostThread;
}) => {
  const isSingle = item.files.length === 1;

  const removeMediaFile = (id: string) => {
    removeFileItem(item.id, id);
  };

  const handleAltTextUpdate = (fileId: string, text: string) => {
    onUpdateFileAltText(item.id, fileId, text);
  };
  const handleFlagUpdate = (id: string, flags: string[]) => {
    onUpdateFileFlags(item.id, id, flags);
  };
  const handleFileUpdate = (id: string, file: File) => {
    onUpdatePostFile(item.id, id, file);
  };
  const sliderRef = useRef<Slider | null>(null);


  useEffect(() => {
    return () => {}
  }, [item.files]);
  

  if (item.files.length === 0) return null;

  if (isSingle) {
    return (
      <MediaItem
        key={0}
        isSingle={isSingle}
        removeFileItem={removeMediaFile}
        item={item.files[0]}
        handleAltTextUpdate={handleAltTextUpdate}
        handleFlagUpdate={handleFlagUpdate}
        handleFileUpdate={handleFileUpdate}
      />
    );
  }

  return (
    <Box sx={{ maxWidth: "100%", position: "relative", mx: 1 }}>
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
          vertical: false,
          verticalSwiping: false,
          centerMode: false,
        }}
      >
        {item.files.map((f) => (
          <MediaItem
            isSingle={isSingle}
            key={item.id}
            item={f}
            removeFileItem={removeMediaFile}
            handleAltTextUpdate={handleAltTextUpdate}
            handleFlagUpdate={handleFlagUpdate}
            handleFileUpdate={handleFileUpdate}
          />
        ))}
      </Slider>
    </Box>
  );
};

export default CarouselContainer;
