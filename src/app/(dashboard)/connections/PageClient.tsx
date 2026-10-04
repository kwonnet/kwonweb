"use client";
import React, { Suspense, useEffect, useState } from "react";
import { Box, CardMedia, Typography } from "@mui/material";

export default function PageClient({
  SuggestedServer,
  MutualFollowsServer,
  PopularCreatorsServer,
  InterestsServer,
  NearYouServer,
}: {
  SuggestedServer?: React.ReactNode;
  MutualFollowsServer?: React.ReactNode;
  PopularCreatorsServer?: React.ReactNode;
  InterestsServer?: React.ReactNode;
  NearYouServer?: React.ReactNode;
}) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    
    const connCarousel = document.querySelector(".conn-carousel")
    if(!connCarousel){
      setShow(false)
    }
    return () => {
      
    }
  }, [])
  

  return (
    <Box sx={{ px: 1, mb: 1 }}>
      {!show ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            overflow: "hidden",
            flexDirection: "column",
            width: "100%"
          }}
        >
          <CardMedia
            component={"img"}
            image={"/no-data.svg"}
            sx={{ height: 300, width: 300 }}
          />
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mb: 2
            }}>
          No user suggestions available at the moment.
        </Typography>
        </Box>
        
      ) : (
        <Box sx={{ px: 1, mb: 1 }}>
            <Box sx={{ mb: 2 }}>{SuggestedServer}</Box>
            <Box sx={{ mb: 2 }}>{MutualFollowsServer}</Box>
            <Box sx={{ mb: 2 }}>{NearYouServer}</Box>
            <Box sx={{ mb: 2 }}>{PopularCreatorsServer}</Box>
            <Box sx={{ mb: 2 }}>{InterestsServer}</Box>
        </Box>
      )}
    </Box>
  );
}
