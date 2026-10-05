"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import useAuthSession from "./useAuthSession";
import { getSessionId, shouldSendLog } from "@/utils";
import { apiUrl } from "@/config";

export default function useTrackImpression(postId: string, ttlMinutes = 2.5) {
  const { ref, inView } = useInView({ threshold: 0.5, fallbackInView: false });
  const { token, user } = useAuthSession();
  useEffect(() => {
    if (!token) return;
    const sessionId = getSessionId();
    if (!inView || document.visibilityState !== 'visible') return;
    const timer = setTimeout(() => {
      if (document.visibilityState !== 'visible' || !shouldSendLog(`${user?.id}:${postId}`, 'POST_LAST_SEEN', ttlMinutes)) return;
      void fetch(`${apiUrl}/posts/${encodeURIComponent(postId)}/impressions`, {
        method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
        body:JSON.stringify({id:postId,sessionId,timestamp:new Date().toISOString()}),keepalive:true,
      }).catch(()=>{});
    },1000);
    return ()=>clearTimeout(timer);

  }, [inView, postId, token, ttlMinutes, user?.id]);

  return ref;
}

