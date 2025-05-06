"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuthSession } from "@/hooks";
import { apiUrl } from "@/config";
import { useSWRConfig } from "swr";
import { UserConnection } from "@/types/user";
import { useNotifications } from "@toolpad/core";

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
    const sseSource = new EventSource(`${apiUrl}/stream`, {
      withCredentials: true,
    });

    setEventSource(sseSource);

    sseSource?.addEventListener("message", (event: MessageEvent<any>) => {
      console.log(`Client is connected to server stream: ${event.data}`);
    });

    sseSource.onerror = (ev) => {
      console.log("Sse error: ", +ev);
    };

    return () => {
      sseSource?.close();
    };
  }, []);

  //   listen to different server events

  const { mutate } = useSWRConfig();

  const mutateData = (
    updateConnData: (users: UserConnection[]) => UserConnection[]
  ) => {
    mutate(
      (key) =>
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

  const updateConnection = (userId: string, isFollow: boolean) => {
    // update connection list for a followed user
    const getFeedData = (cacheData: UserConnection[]) => {
      return cacheData?.map((d) => {
        if (d.id === userId) {
          d = {
            ...d,
            hasFollowed: isFollow,
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
      notif.show("New user_follower event received ", {
        autoHideDuration: 3000,
      });
      const arg: any = JSON.parse(ev.data);
      if (arg.senderId === user.id) {
        // handle stream update
        updateConnection(arg.recipientId,arg.isFollow);
      }
    };
    eventSource?.addEventListener("user_follower", followerListener);

    return () => {
        eventSource?.removeEventListener("user_follower", followerListener);
    };
    // eslint-disable-next-line
  }, []);

  return (
    <SSEContext.Provider value={{ sseSource: eventSource }}>
      {props.children}
    </SSEContext.Provider>
  );
};

export const useSSEContext = (): SSEContextType => useContext(SSEContext);

export default SSEContextProvider;
