"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAuthSession } from "@/hooks";
import { apiUrl } from "@/config";
import { useSWRConfig } from "swr";
import { FollowResponse, FollowStatus, UserConnection } from "@/types/user";
import { useNotifications } from "@/providers/NotificationsProvider";

interface SSEContextType {
  sseSource: EventSource | null;
}

const SSEContext = createContext<SSEContextType>({ sseSource: null });

const SSEContextProvider = (props: any) => {
  const { user } = useAuthSession();

  // console.log(`Auth User`, user);

  const notif = useNotifications();

  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const sseSource = new EventSource(`${apiUrl}/stream`, {
      withCredentials: true,
    });

    setEventSource(sseSource);

    sseSource?.addEventListener("message", (event: MessageEvent<any>) => {
      console.log(`SSE Client is connected to server stream: ${event.data}`);
      console.log(event)
    });

    sseSource.onerror = (ev) => {
      console.log("Sse error: ", ev);
    };

    return () => {
      sseSource?.close();
    };
  }, [user?.id]);

  //   listen to different server events

  const { mutate } = useSWRConfig();

  const mutateData = (
    updateConnData: (users: UserConnection[]) => UserConnection[]
  ) => {
    mutate(
      (key) =>
        // typeof key === "string" && (key.startsWith(`${user.id}_connections`) || key.startsWith('tag_mention')),
       typeof key === "string" && key.startsWith(`${user.id}_connections`),
      (data?: UserConnection[]) => (data ? updateConnData(data) : undefined),
      {
        optimisticData: (data?: any) =>
          data ? updateConnData(data) : undefined,
        populateCache: true,
        rollbackOnError: true,
        revalidate: false,
      }
    );
  };

  const updateConnection = (args: FollowResponse) => {
    // update connection list for a followed user
    const getFeedData = (cacheData: UserConnection[]) => {
      return cacheData?.map((d) => {
        if (d.id === args.recipientId) {
          d = {
            ...d,
            conn: {
              ...d.conn,
              followedStatus: args.status as FollowStatus,
              isFollowedByUser: args.status !== FollowStatus.REJECTED
            }
          };
        }
        return d;
      });
    };
    mutateData(getFeedData);
  };

  useEffect(() => {
    // SSE stream to update user follower
    const followerListener = (ev: MessageEvent) => {
      console.log("user_follower in SSEContext ", ev.data)
      notif.show("New user_follower event received ", {
        autoHideDuration: 3000,
      });
      const arg: FollowResponse = JSON.parse(ev.data);
      if (arg.senderId === user.id) {
        // handle stream update
        updateConnection(arg);
      }
    };
    eventSource?.addEventListener("user_follower", followerListener);

    return () => {
        eventSource?.removeEventListener("user_follower", followerListener);
    };
    // eslint-disable-next-line
  }, [eventSource, user?.id, mutate]);

  const value = useMemo(() => ({ sseSource: eventSource }), [eventSource]);
  return (
    <SSEContext.Provider value={value}>
      {props.children}
    </SSEContext.Provider>
  );
};

export const useSSEContext = (): SSEContextType => useContext(SSEContext);

export default SSEContextProvider;
