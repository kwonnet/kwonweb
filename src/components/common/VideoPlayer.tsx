"use client";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";
import {
  PlyrLayout,
  plyrLayoutIcons,
} from "@vidstack/react/player/layouts/plyr";
import { GoogleCastButton, useMediaStore } from "@vidstack/react";
import { Tooltip } from "@vidstack/react";
import { ChromecastIcon } from "@vidstack/react/icons";

import {
  MediaPlayer,
  MediaPlayerInstance,
  MediaProvider,
  Poster,
} from "@vidstack/react";

import { FeedPost, PostMedia } from "@/types";
import { genVideoUrlInfo, getPostUrl, getSessionId, shouldSendLog } from "@/utils";
import { memo, useEffect, useRef, useState } from "react";
import {
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import { useNotifications } from "@toolpad/core";
import { useInView } from "react-intersection-observer";
import { PostMediaAction, PostMediaKind, PostMediaLog } from "@/types/post";
import { useAuthSession, useTrackVideoWatchTime } from "@/hooks";
import { sendPostLog } from "@/lib/posts";
import { createVideoPlayback } from "@/utils/video-playback-controller";

const trackVideoImpression = (postId: string, mediaId: string, token?: string) => {

  const sessionId = getSessionId();
  const shouldSend = shouldSendLog(mediaId, "MEDIA_IMAGE_IMPRESSION", 5)
  const payload: PostMediaLog = {
    action: PostMediaAction.VIEW,
    kind: PostMediaKind.VIDEO,
    mediaId,
    postId,
    muted: true,
    duration: 0,
    playbackRate: 0,
    timestamp: new Date().toISOString(),
    watchedPct: 0,
    sessionId,
  };
  console.log("sending video view... ", shouldSend)
  shouldSend && sendPostLog(payload, token);
  
}

const VideoPlayer = ({
  item,
  post,
  height,
  autoPlay = false,
  muted = true,
}: {
  item: PostMedia;
  autoPlay?: boolean;
  muted?: boolean;
  post: FeedPost;
  height?: number;
}) => {
  const { hlsUrl, poster } = genVideoUrlInfo(
    item.fileId,
    item.thumbnailUrl,
    item.url
  );
  const { ref: intersectionRef, inView } = useInView({
    threshold: 0.6, // adjust as needed
    triggerOnce: false,
  });

  const { user, token} = useAuthSession()

  const isCurrentUser = post.userId === user?.id

  const notif = useNotifications();
  const playerRef = useRef<MediaPlayerInstance>(null);
  const { canPlay } = useMediaStore(playerRef);
  const playbackRef = useRef<ReturnType<typeof createVideoPlayback> | null>(null);

  const [isLoop, setIsLoop] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    // const { duration } = playerRef.current!.state
    const id = item.fileId.slice(-10);
    const storeKey = `${id}_lwt`;
    const storedTime = localStorage.getItem(storeKey);
    if (storedTime) {
      playerRef.current!.currentTime = parseFloat(storedTime);
    }
    // Subscribe for updates without triggering renders.
    let lastSavedTime = parseFloat(storedTime || "0");
    const unsubscribe = playerRef.current!.subscribe(({ currentTime, duration, paused, ended }) => {
      if(ended || (currentTime >= duration && currentTime > 0)){
        localStorage.removeItem(storeKey);
        lastSavedTime = 0
      }
      else if (paused && currentTime !== duration && currentTime > 0) {
        localStorage.setItem(storeKey, currentTime.toString());
        lastSavedTime = currentTime;
      } 
      // else if (currentTime >= duration && currentTime > 0) {
      //   localStorage.removeItem(storeKey);
      // } 
      else {
        if (Math.abs(currentTime - lastSavedTime) >= 3 && currentTime > 0) {
          localStorage.setItem(storeKey, currentTime.toString());
          lastSavedTime = currentTime;
        }
      }
    });
    
    return unsubscribe;
  }, [item.fileId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const playback = createVideoPlayback(player, autoPlay);
    playbackRef.current = playback;
    return () => {
      playback.dispose();
      playbackRef.current = null;
    };
  }, [hlsUrl, autoPlay]);

  useEffect(() => {
    const updateVisibility = () => {
      playbackRef.current?.update(inView, !document.hidden, canPlay);
    };
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, [hlsUrl, autoPlay, inView, canPlay]);

  // Analytics and authentication changes must not trigger playback.
  useEffect(() => {
    if (inView && !isCurrentUser) {
      trackVideoImpression(post.id, item.id, token);
    }
  }, [inView, isCurrentUser, post.id, item.id, token]);

  // track video watch time
  const watchRef = useTrackVideoWatchTime(playerRef, {
    postId: post.id,
    mediaId: item.id,
    isCurrentUser,
  })

  const handleContextMenu = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    ev.preventDefault();
    setAnchorPosition({ top: ev.clientY, left: ev.clientX });
  };

  const handleClose = () => {
    setAnchorPosition(null);
  };

  const toggleVideoLoop = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (playerRef.current) {
      setIsLoop((prev) => !prev);
    }
    notif.show(isLoop ? "Video loop disabled" : "Video loop enabled", {
      severity: "info",
      autoHideDuration: 2000,
    });
    handleClose();
  };

  const handleLinkCopy = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    const url = getPostUrl(post.id, post.author.username);
    navigator.clipboard.writeText(url);
    notif.show("Link copied", {
      severity: "info",
      autoHideDuration: 2000,
    });
    handleClose();
  };

  return (

    <div
      onClick={(ev) => ev.stopPropagation()}
      ref={(node) => {
        intersectionRef(node); // connect both refs
        watchRef(node)
      }}
      onContextMenu={handleContextMenu}
    >
      {playbackError && (
        <Alert severity="warning">
          Video playback is unavailable. Check your connection or reload this page.
        </Alert>
      )}
      <MediaPlayer
        ref={playerRef}
        title={item.altText}
        src={hlsUrl}
        poster={poster}
        onError={() => setPlaybackError(true)}
        onCanPlay={() => setPlaybackError(false)}
        // Visibility controller owns autoplay; controls retain normal manual playback.
        autoPlay={false}
        onMediaPlayRequest={() => playbackRef.current?.userPlay()}
        onMediaPauseRequest={() => playbackRef.current?.userPause()}
        onEnded={() => {
          if (!isLoop) playbackRef.current?.ended();
        }}
        muted={muted}
        hideControlsOnMouseLeave={true}
        preload="metadata"
        load="visible"
        posterLoad="visible"
        loop={isLoop}
        playsInline={true}
        googleCast={{
          androidReceiverCompatible: true,
          resumeSavedSession: true,
          autoJoinPolicy: "origin_scoped" as any,
          language: "en-US",
        }}
        storage={"tz_p__ss"}
        style={{ ...(height ? { height } : { aspectRatio: "16/9" }) }}
      >
        <MediaProvider>
          <Poster className="media-poster" src={poster} alt={item.altText} />
        </MediaProvider>
        <PlyrLayout
          controls={[
            "play",
            "play-large",
            "progress",
            "current-time",
            "duration",
            "mute+volume",
            "captions",
            "settings",
            "rewind",
            "airplay",
            "pip",
            "fullscreen",
          ]}
          slots={{
            rewindButton: (
              <Tooltip.Root asChild>
                <Tooltip.Trigger asChild>
                  <GoogleCastButton
                    role="button"
                    asChild={true}
                    className="vds-button hover:bg-neutral-800/20 rounded transition-colors duration-200"
                    style={{ height: 32, width: 32, padding: "2px 4px" }}
                  >
                    <ChromecastIcon className="vds-icon" />
                  </GoogleCastButton>
                </Tooltip.Trigger>
                <Tooltip.Content
                  className="vds-tooltip-content"
                  placement="top start"
                >
                  <span>Google Cast</span>
                </Tooltip.Content>
              </Tooltip.Root>
            ),
          }}
          icons={plyrLayoutIcons}
          invertTime={false}
        />
      </MediaPlayer>
      <Popover
        anchorEl={anchorEl}
        onClose={handleClose}
        open={Boolean(anchorPosition)}
        anchorReference="anchorPosition"
        anchorPosition={
          anchorPosition
            ? { top: anchorPosition.top, left: anchorPosition.left }
            : undefined
        }
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              padding: "10px",
              minWidth: "150px",
              background: `rgba(0,0,0,0.7)`,
            },
          },
        }}
      >
        <List>
          <ListItem
            secondaryAction={
              isLoop && (
                <IconButton edge="end" aria-label="comments">
                  <CheckOutlinedIcon />
                </IconButton>
              )
            }
            disablePadding
          >
            <ListItemButton onClick={(ev) => toggleVideoLoop(ev)}>
              <ListItemIcon>
                <RepeatOutlinedIcon />
              </ListItemIcon>
              <ListItemText primary="Loop" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton onClick={(ev) => handleLinkCopy(ev)}>
              <ListItemIcon>
                <LinkIcon />
              </ListItemIcon>
              <ListItemText primary="Copy video url" />
            </ListItemButton>
          </ListItem>

          {/* <ListItem disablePadding>
            <ListItemButton onClick={ev => handleEmbedCopy(ev)}>
              <ListItemIcon>
                <CodeOutlinedIcon />
              </ListItemIcon>
              <ListItemText primary="Embed post" />
            </ListItemButton>
          </ListItem> */}
        </List>
      </Popover>
    </div>
  );
};

export default memo(VideoPlayer);
