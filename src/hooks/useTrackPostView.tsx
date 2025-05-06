"use client";
import { apiUrl } from "@/config";
import { convertJsonToFormBody, getSessionId, shouldSendLog } from "@/utils";
import { useEffect, useRef } from "react";
import useAuthSession from "./useAuthSession";
import debounce from "lodash/debounce";

export default function useTrackPostView(postId: string, ttlMinutes = 3.5) {
  const startRef = useRef<number>(0);
  const { token } = useAuthSession();
  useEffect(() => {
    const sessionId = getSessionId();

    startRef.current = Date.now();

    const sendPostView = debounce(async () => {
      const body = {
        id: postId,
        sessionId,
        duration: Math.round((Date.now() - startRef.current) / 1000),
        timestamp: new Date().toISOString(),
      };
      console.log("About to track post view ", body);
      const data = convertJsonToFormBody(body);
      const shouldTrack = shouldSendLog(postId, "POST_LAST_VIEWED", ttlMinutes);
      if (shouldTrack) {
        navigator.sendBeacon(
          `${apiUrl}/posts/${postId}/views?token=${token}`,
          new Blob([data], { type: "application/x-www-form-urlencoded" })
        );
        console.log("Post view tracked ", postId)
      }
      startRef.current = Date.now();
    }, 500);

    const timeout = setTimeout(sendPostView, 3000); // Track only if visible for 3s

    const onVisibilityListener = () => {
      if (document.visibilityState === "hidden") sendPostView();
    };

    document.addEventListener("visibilitychange", onVisibilityListener);
    window.addEventListener("beforeunload", sendPostView);

    return () => {
      clearTimeout(timeout);
      sendPostView();
      window.removeEventListener("beforeunload", sendPostView);
      document.removeEventListener("visibilitychange", onVisibilityListener);
    };
  }, [postId]);
}
