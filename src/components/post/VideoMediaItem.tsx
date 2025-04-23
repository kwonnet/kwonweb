"use client";
import React, { useCallback, useState } from "react";
import { PostMedia } from "@/types";
import VideoJsPlayer from "./VideoJsPlayer";
import Player from "video.js/dist/types/player";
import { getMobileScaledDimensions, isMobileScreenshot } from "@/utils";
import MediaPreview from "./MediaPreview";
import { Box } from "@mui/material";

const VideoMediaItem = ({
  item,
  height,
}: {
  item: PostMedia;
  height?: number;
}) => {
  const [state, setState] = useState({ open: false });

  const toggleDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    ev.stopPropagation();
    setState((prev) => ({ ...prev, open }));
  };

  const isMobile = isMobileScreenshot(item.width, item.height);

  const playerRef = React.useRef<Player | null>(null);

  const dim = getMobileScaledDimensions(item.width, item.height, 400, 200);

  const videoJsOptions = {
    autoplay: false,
    controls: true,
    responsive: false,
    fluid: true,
    playsinline: true,
    pip: true,
    userActions: {
      hotkeys: true,
    },
    preload: "auto",
    width: "100%",
    height: height ? height : Math.min(dim.height, 200),
    maxHeight: 200,
    sources: [
      // {
      //     src: `https://725xlp02-3000.usw3.devtunnels.ms/test-video.mov`, //`${item.url}?tr=w-${dim.width},h-${dim.height},c-maintain_ratio`,
      //     type: "video/mp4",
      //     withCredentials: true
      //   },
      {
        src: `https://725xlp02-3000.usw3.devtunnels.ms/torazone_short_version.mp4`, //`${item.url}?tr=w-${dim.width},h-${dim.height},c-maintain_ratio`,
        type: "video/mp4",
        withCredentials: true,
      },
    ],
  };

  const handlePlayerReady = useCallback((player: Player) => {
    playerRef.current = player;
    // You can handle player events here, for example:
    player.on("waiting", () => {
      console.log("player is waiting");
    });

    player.on("dispose", () => {
      console.log("player will dispose");
    });
  }, []);

  const handlePreview = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    toggleDrawer(ev, true);
  }

  return (
    <React.Fragment>
      <Box onClick={ev => handlePreview(ev)}>
      <VideoJsPlayer options={videoJsOptions} onReady={handlePlayerReady} />
      </Box>
      <MediaPreview
        media={item}
        isOpen={state.open}
        toggleDrawer={toggleDrawer}
      />
    </React.Fragment>
  );
};

export default VideoMediaItem;
