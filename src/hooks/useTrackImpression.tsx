"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import useAuthSession from "./useAuthSession";
import { convertJsonToFormBody, getSessionId, shouldSendLog } from "@/utils";
import { apiUrl } from "@/config";

export default function useTrackImpression(postId: string, ttlMinutes = 2.5) {
  const { ref, inView } = useInView({ threshold: 0.5, fallbackInView: true });
  const { token } = useAuthSession();
  useEffect(() => {
    const sessionId = getSessionId();
    const trackImpression = async (body: {id: string, sessionId: string, timestamp: string | Date}, accessToken?: string) => {
      const data = convertJsonToFormBody(body);
      navigator.sendBeacon(`${apiUrl}/posts/${body.id}/impressions?token=${accessToken}`, new Blob([data], { type: 'application/x-www-form-urlencoded',  }));
    }

    if (inView) {
        const payload = {id: postId, sessionId, timestamp: new Date().toISOString()}
        const shouldTrack = shouldSendLog(postId, "POST_LAST_SEEN", ttlMinutes);
        shouldTrack && trackImpression(payload, token);
    }
  }, [inView]);

  return ref;
}

