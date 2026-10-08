"use client";
import { useAuthSession } from "@/hooks";
import { getSuggestedConnections, updateUserFollower } from "@/lib/users";
import { FollowAction, FollowResponse, FollowStatus, UserConn, UserConnection } from "@/types/user";
import { Box, CardMedia, Typography } from "@mui/material";
import React, { useEffect } from "react";
import useSWR from "swr";

import { getErrorMessage } from "@/utils";
import { ConnTypeEnum } from "@/types";
import DisplayCarousel from "./DisplayCarousel";
import DisplaySection from "./DisplaySection";
import { ConnectionSkeleton } from "@/components/skeleton";
import { getFollowStatus } from "@/utils/connections";
import { useSSEContext } from "@/context/SSEContext";

const DisplayClient = ({
  users,
  connType,
  allowCarousel = false,
}: {
  users: UserConnection[];
  connType: ConnTypeEnum;
  allowCarousel?: boolean;
  hasData?: boolean;
}) => {
  const { token, user } = useAuthSession();
  const { sseSource } = useSSEContext();
  const swrKey = `${user.id}_connections_${connType}`;
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    () => getSuggestedConnections({ limit: 21, type: connType }, token),
    {
      fallbackData: users,
      revalidateOnMount: false,
      keepPreviousData: true,
      refreshWhenOffline: false,
    }
  );

  const updateConn = (
    recipientId: string,
    conn: UserConn,
    action: FollowAction
  ) => {
    const updateData = (_data: UserConnection[]) => {
      const actions = [
        FollowAction.UNFOLLOW,
        FollowAction.ACCEPT,
        FollowAction.CANCEL,
        FollowAction.REJECT,
      ];
      if (actions.includes(action)) {
        return _data.filter((d) => d?.id !== recipientId);
      } else {
        return _data.map((d) => {
          if (d?.id === recipientId) {
            d = {
              ...d,
              conn: { ...d?.conn, ...conn, followerCount: conn.followerCount + 1 },
            };
          }
          return d;
        });
      }
    };
    // update reposter
    mutate((_data) => (!_data ? _data : updateData(_data)), {
      optimisticData: (_data) => (!_data ? [] : updateData(_data)),
      revalidate: false,
      populateCache: true,
      rollbackOnError: true,
    });
  };

  const mutateOnResponseData = (recipientId: string) => {
    const updateData = (_data: UserConnection[]) => {
      return _data.filter((d) => d?.id !== recipientId);
    };
    mutate((_data) => (!_data ? _data : updateData(_data)), {
      optimisticData: (_data) => (!_data ? [] : updateData(_data)),
      revalidate: false,
      populateCache: true,
      rollbackOnError: true,
    });
  };

  const onFollowUser = (connUser: UserConnection, action: FollowAction) => {
      const conn = getFollowStatus(connUser.conn, connUser.meta, action);
      const recipientId = connUser.id
      // mutate for current user
      updateConn(recipientId, conn, action );
      // send to api
      updateUserFollower({ senderId: user.id, recipientId, action }, token);
    };

  useEffect(() => {
    // mutate and filter out when sse event is emitted
      const listener = (ev: MessageEvent) => {
        const body: FollowResponse = JSON.parse(ev.data);
        // check if user profile
        if (body.senderId === user.id) {
          mutateOnResponseData(body.recipientId)
        }
      };
      sseSource?.addEventListener("user_follower", listener);
      return () => {
        sseSource?.removeEventListener("user_follower", listener);
      };
      // eslint-disable-next-line
    }, [sseSource]);

  const isError404 = error?.status === 404 || (!error && data?.length === 0);

  return (
    <React.Fragment>
      {/* display 404 error */}
      {(!allowCarousel &&((error && !data) || data?.length === 0)) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            overflow: "hidden",
            width: "100%"
          }}
        >
          <CardMedia
            component={"img"}
            image={!isError404 ? "/not-found.svg" : "/no-data.svg"}
            sx={{ height: 300, width: 300 }}
          />
          <Typography>{!isError404 ? getErrorMessage(error) : null} </Typography>
        </Box>
      )}
      {isLoading && !error && <ConnectionSkeleton />}
      {/* display content */}
      {allowCarousel ? (
        <DisplayCarousel items={data} onFollowUser={onFollowUser} />
      ) : (
        <DisplaySection items={data} onFollowUser={onFollowUser} />
      )}
    </React.Fragment>
  );
};

export default DisplayClient;
