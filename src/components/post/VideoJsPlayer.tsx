import React from 'react'

const VideoJsPlayer = ({ poster, options, onReady, onPlay, onPause }: { poster: any, options: any, onReady: any, onPlay: any, onPause: any }) => {
  return (
    <div>VideoJsPlayer</div>
  )
}

export default VideoJsPlayer

// 'use client'
// import React, { useRef, useEffect, memo } from 'react';
// import { Box } from '@mui/material';
// // import videojs from 'video.js';
// // import Player from 'video.js/dist/types/player';
// // import "@videojs/http-streaming"; // Import HTTP streaming for adaptive playback
// // import 'video.js/dist/video-js.css';


// interface VideoPlayerProps {
//   poster?: string;
//   onPlay?: () => void;
//   onPause?: () => void;
//   onReady?: (player: Player) => void;
//   options: {
//     autoplay: boolean;
//     controls: boolean;
//     responsive: boolean;
//     fluid: boolean;
//     playsinline: boolean;
//     pip: boolean;
//     preload: string;
//     width: number | string;
//     height: number | string;
//     userActions: {
//       hotkeys: boolean;
//     },
//     sources: {
//         src: string;
//         type: string;
//     }[];
// }
// }

// const VideoJsPlayer = memo(({ poster, options, onReady, onPlay, onPause }: VideoPlayerProps) => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const playerRef = useRef<any>(null);

//   useEffect(() => {
//     if (videoRef.current) {
//       const player = playerRef.current = videojs(videoRef.current, {
//         ...options,
//         html5: {
//           vhs: {
//             captionServices: {
//               CC1: {
//                 language: 'en',
//                 label: 'English'
//               },
//             },
//             withCredentials: true,
//             overrideNative: true,
//             enableLowInitialPlaylist: true, // Starts with lower quality to reduce buffering
//           },
//           nativeAudioTracks: false,
//           nativeVideoTracks: false
//         }
//       }, () => {
//         videojs.log('player is ready');
//         onReady && onReady(player);
//       });
//       player.src(options.sources);
//       player.poster(poster);

//       // player.on('play', onPlay);
//       // player.on('pause', onPause);

//       return () => {
//         // if (player && !player.isDisposed()) {
//         //   player.dispose();
//         //   playerRef.current = null;
//         // }
//       };
//     }
//   }, [ videoRef, poster, onPlay, onPause]);

//   const height = typeof options.height === 'number' ? `${options.height}px` : options.height;

//   const width = typeof options.width === 'number' ? `${options.width}px` : options.width;

//   return (
//     <Box sx={{ position: 'relative'}}>
//       <video
//         id="my-player"
//         ref={videoRef}
//         className="video-js vjs-big-play-centered vjs-default-skin"
//         preload="auto"
//         playsInline={true}
//         controls={true}
//         style={{
//           width: width,
//           height: height,
//           objectFit: 'contain',
//           borderRadius: '20px',
//           display: "block",
//           paddingTop: "0",
//         }}
//       />
//     </Box>
//   );
// });

// export default VideoJsPlayer;
