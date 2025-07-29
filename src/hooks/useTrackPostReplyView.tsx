'use client'
import { convertJsonToFormBody, getSessionId, shouldSendLog } from "@/utils";
import React, { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import debounce from "lodash/debounce";
import { apiUrl } from "@/config";
import useAuthSession from "./useAuthSession";



export default function useTrackPostReplyView(postId: string, ttlMinutes = 3.5) {
  const startRef = useRef<number>(0);
  const hasSent = useRef(false);
  const { ref, inView } = useInView({ threshold: 0.4 });
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
      console.log("About to track post thread or reply view ", body);
      const data = convertJsonToFormBody(body);
      const shouldTrack = shouldSendLog(postId, "REPLY_LAST_VIEWED", ttlMinutes); 
      if(shouldTrack) {
        navigator.sendBeacon(
        `${apiUrl}/posts/${postId}/views?token=${token}`,
        new Blob([data], { type: "application/x-www-form-urlencoded" })
      );
      console.log("Reply tracked ", postId)
    }
    }, 100);
    if (inView && !hasSent.current) {
      startRef.current = Date.now();
      hasSent.current = true;

      const timer = setTimeout(sendPostView, 2000);

      return () => clearTimeout(timer);
    }
  }, [inView, postId]);

  return ref;
}
