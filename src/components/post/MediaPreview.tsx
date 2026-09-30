"use client";
import {
  Box,
  Container,
  IconButton,
  SwipeableDrawer,
  CardMedia,
  Stack,
  CircularProgress,
} from "@mui/material";
import { ArrowBack, Close } from "@mui/icons-material";
import React, { useRef, useState } from "react";
import { FeedPost, PostMedia } from "@/types";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { toast } from "react-toastify";
import Slider from "react-slick";
import { VideoPlayer } from "../common";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { getSessionId, shouldSendLog } from "@/utils";
import { PostMediaAction, PostMediaKind, PostMediaLog } from "@/types/post";
import { sendPostLog } from "@/lib/posts";
import { useAuthSession } from "@/hooks";

const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {}
};

const MediaItem = ({ item, post }: { item: PostMedia; post: FeedPost }) => {
  if (item.fileType.startsWith("video")) {
    return (
      <Box sx={{ px: 2 }}>
        <Box
          key={item.id}
          sx={{
            width: "100%",
            height: "calc(100vh - 80px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            borderRadius: 2,
            position: "relative",
            py: 2,
          }}
        >
          <VideoPlayer item={item} post={post} />
        </Box>
      </Box>
    );
  }
  const isPortrait = item.width < item.height;
  return (
    <Box sx={{ px: 2 }}>
      <Box
        key={item.id}
        sx={{
          width: "100%",
          height: "calc(100vh - 100px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          borderRadius: 2,
          position: "relative",
        }}
      >
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={16}
          doubleClick={{ disabled: false }}
          centerOnInit={true}
          centerZoomedOut={true}
          wheel={{ step: 0.1 }}
        >
          <TransformComponent>
            <CardMedia
              component="img"
              image={item.url}
              alt={item.altText}
              sx={{
                objectFit: "contain",
                maxWidth: "100%",
                maxHeight: !isPortrait ? "100%" : "calc(100vh - 100px)",
                height: "100%",
                margin: "auto",
                borderRadius: 2,
                userSelect: "none",
                pointerEvents: "all",
                display: "block",
              }}
            />
          </TransformComponent>
        </TransformWrapper>
      </Box>
    </Box>
  );
};

const MediaPreview = ({
  isOpen,
  toggleDrawer,
  item,
  post,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  item: PostMedia;
  post: FeedPost;
}) => {
  const media = React.useMemo(() => {
    return post?.media ?? [];
  }, [post?.media]);

  const initialSlide = React.useMemo(() => {
    const index = media.findIndex((m) => m.id === item.id);
    return index > -1 ? index : 0;
  }, [item, media]);

  const sliderRef = useRef<Slider | null>(null);

  const [state, setState] = useState({
    loading: false,
    currentSlide: initialSlide,
  });

  const open = React.useMemo(() => isOpen, [isOpen]);

  const { user, token } = useAuthSession();

  // const isVideo = item.fileType?.includes("video")

  const handleDownload = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, loading: true }));
    setTimeout(() => setState((prev) => ({ ...prev, loading: false })), 1500);
    // const currentSlide = sliderRef.current?.state
    // openLink(media.url)
    const currItem = media.find((m, index) => index === state.currentSlide);
    if (currItem) {
      downloadFile(currItem.url, currItem.name);
      const sessionId = getSessionId();
      const shouldSend = shouldSendLog(currItem.id, "MEDIA_IMAGE_SAVE");
      const payload: PostMediaLog = {
        action: PostMediaAction.DOWNLOAD,
        kind: PostMediaKind.IMAGE,
        mediaId: currItem.id,
        postId: post.id,
        muted: true,
        duration: 0,
        playbackRate: 0,
        timestamp: new Date().toISOString(),
        watchedPct: 0,
        sessionId,
      };
      if (open && shouldSend && post.userId !== user.id) {
        sendPostLog(payload, token);
      }
    }
  };
  const getCurrItem = () => {
    return media.find((_m, index) => index === state.currentSlide);
  };
  const isVideoItem = () => {
    return !!getCurrItem()?.fileType?.includes("video");
  };

  const handleTrackLog = (currentSlide: number) => {
    const currItem = media.find((_m, index) => index === currentSlide);
    if (currItem && currItem.fileType?.includes("image")) {
      const sessionId = getSessionId();
      const shouldSend = shouldSendLog(currItem.id, "MEDIA_IMAGE_VIEW");
      const payload: PostMediaLog = {
        action: PostMediaAction.VIEW,
        kind: PostMediaKind.IMAGE,
        mediaId: currItem.id,
        postId: post.id,
        muted: true,
        duration: 0,
        playbackRate: 0,
        timestamp: new Date().toISOString(),
        watchedPct: 0,
        sessionId,
      };
      if (open && shouldSend && post.userId !== user.id) {
        sendPostLog(payload, token);
      }
    }
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
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
      slotProps={{
        paper: {
          sx: [(theme) => ({
            top: "0",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            zIndex: 999999,
            height: "100vh",
            overflow: "hidden",
            background: "rgba(255, 255, 255, 0.6)",
            ...theme.applyStyles("dark", {
              background: "rgba(0, 0, 0, 0.8)",
            })
          })],
        },
      }}
    >
      <Box
        sx={{
          height: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top Actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 1.5,
            // mt: 4,
            zIndex: 1000,
          }}
        >
          <IconButton color="inherit" onClick={(ev) => toggleDrawer(ev, false)}>
            <Close />
          </IconButton>
          {!isVideoItem() &&
            (() => {
              const fileItem = getCurrItem();
              if (!fileItem?.url) return null;
              return (
                <IconButton color="inherit" onClick={(ev) => handleDownload(ev)}>
                  <FileDownloadOutlinedIcon />
                </IconButton>
              );
            })()}
        </Box>

        {/* Centered Content */}
        <Box
          sx={{
            width: "100%",
            height: "100%",
            px: { lg: 6, md: 6, sm: 6, xs: 6 }, // small padding on mobile
          }}
        >
          {media.length === 1 ? (
            <MediaItem item={media[0]} post={post} />
          ) : (
            <Slider
              ref={sliderRef}
              {...{
                autoplay: false,
                infinite: true,
                speed: 500,
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: true,
                swipeToSlide: true,
                dots: false,
                initialSlide,
                afterChange(currentSlide) {
                  setState((prev) => ({ ...prev, currentSlide }));
                  handleTrackLog(currentSlide);
                },
              }}
            >
              {media.map((item) => (
                <MediaItem key={item.id} item={item} post={post} />
              ))}
            </Slider>
          )}
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

export default MediaPreview;
