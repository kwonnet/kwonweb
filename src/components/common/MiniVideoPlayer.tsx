"use client";
// import "@vidstack/react/player/styles/base.css";
// import "@vidstack/react/player/styles/plyr/theme.css";
import {
  PlyrLayout,
  plyrLayoutIcons,
} from "@vidstack/react/player/layouts/plyr";

import { MediaPlayer, MediaProvider } from "@vidstack/react";

import { memo, useEffect } from "react";

const MiniVideoPlayer = ({ src }: { src: string }) => {
  useEffect(() => {
    return () => {}
  }, [src])
  
  return (
    <div style={{ height: 320 }}>
      <MediaPlayer
        aspectRatio="16/9"
        title={""}
        src={{ src, type: "video/mp4" }}
        viewType="video"
        autoPlay={false}
        muted={false}
        preload="auto"
        load="visible"
        posterLoad="visible"
      >
        <MediaProvider></MediaProvider>
        <PlyrLayout
          controls={[
            "play",
            "play-large",
            "progress",
            "current-time",
            "duration",
            "volume",
            "fullscreen",
          ]}
          icons={plyrLayoutIcons}
          invertTime={false}
        />
      </MediaPlayer>
    </div>
  );
};

export default memo(MiniVideoPlayer);
