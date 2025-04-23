"use client";
import React from "react";
import { PostMedia } from "@/types";
import FeedMediaItem from "./FeedMediaItem";
import { Box, Grid2, useMediaQuery, useTheme } from "@mui/material";
import FeedMediaCarousel from "./FeedMediaCarousel";
import VideoMediaItem from "./VideoMediaItem";

const DisplayFeedMedia = ({ media }: { media: PostMedia[] }) => {

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  if (media.length === 1) {
    const item = media[0];
    return item.fileType.startsWith("image") ? (
      <FeedMediaItem height={isMobile ? 200 : 400} item={item} isSingle={true} />
    ) : (
      <VideoMediaItem item={item} />
    );
  }

  if (media.length === 2) {
    return (
      <Grid2 container spacing={1}>
        {media.map((item) => (
          <Grid2 key={item.id} size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
            {item.fileType.startsWith("image") ? (
              <FeedMediaItem height={isMobile ? 150 : 250} item={item} isSingle={true} />
            ) : (
              <Box
                sx={{
                  py: 1,
                  display: "block",
                }}
              >
              <VideoMediaItem height={150} item={item} />
              </Box>
            )}
          </Grid2>
        ))}
      </Grid2>
    );
  }

  return <FeedMediaCarousel media={media} />;
};

export default DisplayFeedMedia;

// "use client";
// import React, { useCallback } from "react";
// import Box from "@mui/material/Box";
// import { PostMedia } from "@/types";
// import VideoJsPlayer from "./VideoJsPlayer";
// import FeedMediaItem from "./FeedMediaItem";
// import Player from "video.js/dist/types/player";
// import ReactPlayer from 'react-player'

// function getMobileScaledDimensions(
//   originalWidth: number,
//   originalHeight: number,
//   screenWidth: number,
//   screenHeight: number
// ): { width: number; height: number } {
//   const aspectRatio = originalWidth / originalHeight;

//   let newWidth = screenWidth;
//   let newHeight = newWidth / aspectRatio;

//   if (newHeight > screenHeight) {
//     newHeight = screenHeight;
//     newWidth = newHeight * aspectRatio;
//   }

//   return { width: Math.round(newWidth), height: Math.round(newHeight) };
// }

// const DisplayFeedMedia = ({
//   item,
//   isSingle,
// }: {
//   item: PostMedia;
//   isSingle: boolean;
// }) => {
//   const playerRef = React.useRef<Player | null>(null);

//   if (item.fileType === "image") {
//     return <FeedMediaItem item={item} isSingle={isSingle} />;
//   }

//   const dim = getMobileScaledDimensions(item.width, item.height, 400, 320);

//   return <div className='player-wrapper'>
//         <ReactPlayer
//             className='react-player'
//             pip={true}
//             muted={true}
//             controls={true}
//             playsinline={true}
//             previewTabIndex={1}
//             url={`https://725xlp02-3000.usw3.devtunnels.ms/torazone_short_version.mp4`}
//             width='100%'
//             height='320px'
//             />
//     </div>;
// };

// export default DisplayFeedMedia;

// "use client";
// import React, { useCallback } from "react";
// import Box from "@mui/material/Box";
// import { PostMedia } from "@/types";
// import VideoJsPlayer from "./VideoJsPlayer";
// import FeedMediaItem from "./FeedMediaItem";
// import Player from "video.js/dist/types/player";
// import ReactPlayer from 'react-player'

// // function getMobileScaledDimensions(
// //     originalWidth: number,
// //     originalHeight: number,
// //     screenWidth: number,
// //     screenHeight: number,
// //     maxHeightPercentage: number = 0.5 // Limit to 50% of screen height by default
// //   ): { width: number; height: number } {
// //     const aspectRatio = originalWidth / originalHeight;
// //     const maxHeight = screenHeight * maxHeightPercentage;

// //     let newWidth = screenWidth;
// //     let newHeight = newWidth / aspectRatio;

// //     if (newHeight > maxHeight) {
// //       newHeight = maxHeight;
// //       newWidth = newHeight * aspectRatio;
// //     }

// //     return { width: Math.round(newWidth), height: Math.round(newHeight) };
// //   }

// function getMobileScaledDimensions(
//   originalWidth: number,
//   originalHeight: number,
//   screenWidth: number,
//   screenHeight: number
// ): { width: number; height: number } {
//   const aspectRatio = originalWidth / originalHeight;

//   let newWidth = screenWidth;
//   let newHeight = newWidth / aspectRatio;

//   if (newHeight > screenHeight) {
//     newHeight = screenHeight;
//     newWidth = newHeight * aspectRatio;
//   }

//   return { width: Math.round(newWidth), height: Math.round(newHeight) };
// }

// const DisplayFeedMedia = ({
//   item,
//   isSingle,
// }: {
//   item: PostMedia;
//   isSingle: boolean;
// }) => {
//   const playerRef = React.useRef<Player | null>(null);

//   if (item.fileType === "image") {
//     return <FeedMediaItem item={item} isSingle={isSingle} />;
//   }

//   const dim = getMobileScaledDimensions(item.width, item.height, 400, 320);

//   const videoJsOptions = {
//     autoplay: false,
//     controls: true,
//     responsive: false,
//     fluid: true,
//     preload: "auto",
//     width: dim.width,
//     height: dim.height,
//     sources: [
//       {
//         src: `https://725xlp02-3000.usw3.devtunnels.ms/torazone_short_version.mp4`, //`${item.url}?tr=w-${dim.width},h-${dim.height},c-maintain_ratio`,
//         type: "video/mp4",
//       },
//     ],
//   };

//   const handlePlayerReady = useCallback((player: Player) => {
//     playerRef.current = player;
//     // You can handle player events here, for example:
//     player.on("waiting", () => {
//       console.log("player is waiting");
//     });

//     player.on("dispose", () => {
//       console.log("player will dispose");
//     });
//   }, []);

//   return <VideoJsPlayer options={videoJsOptions} onReady={handlePlayerReady} />;
// };

// export default DisplayFeedMedia;
