"use client";
import { useEffect, useRef } from "react";
import { MediaPlayerInstance } from "@vidstack/react";
import { getSessionId, shouldSendLog } from "@/utils";
import useAuthSession from "./useAuthSession";
import { PostMediaAction, PostMediaKind, PostMediaLog } from "@/types/post";
import { sendPostLog } from "@/lib/posts";
import { useInView } from "react-intersection-observer";

const watchMilestones = [5, 10, 25, 50, 75, 90, 100] as const;

const useTrackVideoWatchTime = (
  playerRef: React.RefObject<MediaPlayerInstance | null>,
  args: {
    postId: string;
    mediaId: string;
    isCurrentUser: boolean;
  }
) => {
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
    fallbackInView: true,
  });

  const { token } = useAuthSession();
  const watchTimeRef = useRef(0); // Accumulated session duration in seconds
  const triggeredMilestones = useRef<Set<number>>(new Set());
  const sessionId = useRef(getSessionId()).current;
  const hasEndedLogged = useRef(false);

  // Common video watch milestones
  useEffect(() => {
    if (!inView || args.isCurrentUser) return;

    const player = playerRef.current;
    if (!player) return;

    let sessionStartTime: number | null = player?.$state.paused()
      ? null
      : Date.now();
    let intervalId: NodeJS.Timeout;

    const calSessionDuration = (reset?: boolean) => {
      if (sessionStartTime) {
        const sessionEnd = Date.now();
        watchTimeRef.current += (sessionEnd - sessionStartTime) / 1000;
      }
      if (reset) sessionStartTime = null;
      return Number(watchTimeRef.current.toFixed(2));
    };

    const onPlay = () => {
      sessionStartTime = Date.now();
    };

    const onPause = () => {
      calSessionDuration(true);
      trackLog();
    };

    const onEnded = () => {
      if (!hasEndedLogged.current) {
        calSessionDuration(true);
        trackLog(true); // Final log
      }
    };

    const trackLog = (force = false) => {
      const duration = player.duration || 0;
      const currentTime = player.currentTime || 0;
      if (!duration || !currentTime) return;
      const watchedPct = Number(((currentTime / duration) * 100).toFixed(2));
      const roundedWatchedPct = Math.round(watchedPct);
      // Find next milestone
      const milestone = watchMilestones.find(
        (m) => roundedWatchedPct >= m && !triggeredMilestones.current.has(m)
      );
      if (milestone || force) {
        // Force-adding 100% on end
        const sessionDuration = calSessionDuration();
        const payload: PostMediaLog = {
          action: PostMediaAction.WATCH,
          kind: PostMediaKind.VIDEO,
          mediaId: args.mediaId,
          postId: args.postId,
          muted: player?.$state.muted(),
          playbackRate: player?.$state.playbackRate(),
          sessionDuration,
          timestamp: new Date().toISOString(),
          duration,
          watchedPct,
          sessionId,
        };

        const shouldSend =
          force || shouldSendLog(args.mediaId, "MEDIA_VIDEO_WATCH", 0.17);

        if (shouldSend && sessionDuration >= 1) {
          triggeredMilestones.current.add(force ? 100 : milestone || 100);
          sendPostLog(payload, token);
          if (force) hasEndedLogged.current = true;
        }
      }
    };

    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onEnded);

    // Poll every 5 seconds
    intervalId = setInterval(() => {
      if (!player?.$state.paused() && player?.duration > 0) {
        trackLog();
      }
    }, 5000);

    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onEnded);
      clearInterval(intervalId);
    };
  }, [inView, playerRef, args.isCurrentUser, args.mediaId, args.postId, sessionId, token]);

  return ref;
};

export default useTrackVideoWatchTime;
