"use client";
import {
  Box,
  Container,
  Grid2,
  IconButton,
  Button,
  Typography,
  SwipeableDrawer,
  CardMedia,
  Stack,
  CircularProgress,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import React, { useCallback, useState } from "react";
import { PostMedia } from "@/types";
import VideoJsPlayer from "./VideoJsPlayer";
import Player from "video.js/dist/types/player";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { toast } from "react-toastify";
import { openLink } from "@telegram-apps/sdk-react";

// const downloadFile = (fileUrl: string, fileName: string) => {
//   const link = document.createElement("a");
//   link.href = fileUrl;
//   link.download = fileName;
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// };

const downloadFile = (fileUrl: string, fileName: string) => {
    fetch(fileUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Download completed")
      })
      .catch(error => console.error("Download failed:", error));
  };
  

function getMobileScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  screenWidth: number,
  screenHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let newWidth = screenWidth;
  let newHeight = newWidth / aspectRatio;

  if (newHeight > screenHeight) {
    newHeight = screenHeight;
    newWidth = newHeight * aspectRatio;
  }

  return { width: Math.round(newWidth), height: Math.round(newHeight) };
}

const VideoPreviewItem = ({
  item,
  height,
}: {
  item: PostMedia;
  height?: number;
}) => {
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

  return <VideoJsPlayer options={videoJsOptions} onReady={handlePlayerReady} />;
};

const MediaPreview = ({
  isOpen,
  toggleDrawer,
  media,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  media: PostMedia;
}) => {
  const [state, setState] = useState({ loading: false });
  const open = React.useMemo(() => isOpen, [isOpen]);

  const isVideo = media.fileType !== "image";

  const handleDownload = (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    ev.preventDefault();
    toast.info(`Downloading file...`);
    setState((prev) => ({ ...prev, loading: true }));
    setTimeout(() => setState((prev) => ({ ...prev, loading: false })), 1500);
    // openLink(media.url)
    downloadFile(media.url, media.name);
    
  };

  return (
    <SwipeableDrawer
      sx={{
        zIndex: 999999999,
        height: "100vh",
        overflow: "hidden",
      }}
      anchor={"bottom"}
      open={open}
      onClose={(ev) => toggleDrawer(ev, false)}
      onOpen={(ev) => {}}
      PaperProps={{
        sx: {
          top: "0",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
          zIndex: 999999,
          height: "100vh",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ width: "auto" }} role="presentation">
        <Stack
          direction={"row"}
          sx={{ alignItems: "center", mx: 1, justifyContent: "space-between" }}
        >
          <IconButton color="inherit" onClick={(ev) => toggleDrawer(ev, false)}>
            <ArrowBack />
          </IconButton>

          <IconButton
            sx={{ borderRadius: 30 }}
            onClick={(ev) => handleDownload(ev)}
            disabled={state.loading}
          >
            {state.loading ? (
              <CircularProgress size={16} />
            ) : (
              <FileDownloadOutlinedIcon />
            )}
          </IconButton>
        </Stack>
        <Container maxWidth="xl" sx={{ mt: 0, pb: 2 }}>
          {isVideo ? (
            <VideoPreviewItem item={media} />
          ) : (
            <Box
              sx={{
                py: 1,
                display: "block",
              }}
            >
              <CardMedia
                height={media.height}
                component={"img"}
                src={media.url}
                alt={media.altText}
                sx={{
                  cursor: "pointer",
                  borderRadius: 5,
                  position: "relative",
                  display: "block",
                  width: media.width,
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                }}
              />
            </Box>
          )}
        </Container>
      </Box>
    </SwipeableDrawer>
  );
};

export default MediaPreview;
