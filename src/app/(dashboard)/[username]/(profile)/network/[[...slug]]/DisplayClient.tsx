"use client";
import { useAuthSession } from "@/hooks";
import { getErrorMessage } from "@/utils";
import {
  Box,
  Button,
  CardMedia,
  Grid,
} from "@mui/material";
import { debounce } from "lodash";
import React from "react";
import useSWRInfinite from "swr/infinite";
import { blockUser, getUserConnections, muteUser, updateUserFollower } from "@/lib/users";
import { FollowAction, UserConn, UserConnection } from "@/types/user";
import ConnectionCard from "./ConnectionCard";
import DisplayError from "@/components/common/DisplayError";
import { getFollowStatus } from "@/utils/connections";


const PAGE_SIZE = 21;

const DisplayClient = ({
  connections,
  slug,
  userId,
  initialSlug = slug,
  initialFetchFailed = false,
}: {
  connections: UserConnection[];
  slug: string;
  userId: string;
  initialSlug?: string;
  initialFetchFailed?: boolean;
}) => {

  const { token, user } = useAuthSession();

  const getKey = (pageIndex: number, previousPageData?: UserConnection[]) => {
    if (pageIndex !== 0 && previousPageData && !previousPageData.length)
      return null; // Stop when no more data
    return {
      type: `${slug}_conn`,
      slug,
      userId,
      limit: PAGE_SIZE,
      page: pageIndex + 1,
    };
  };

  const { data, error, isLoading, isValidating, size, mutate, setSize } =
    useSWRInfinite(getKey, (args) => getUserConnections(args, token), {
      keepPreviousData: false,
      refreshWhenOffline: false,
      fallbackData: initialSlug === slug ? [connections] : undefined,
      revalidateOnMount: initialFetchFailed || initialSlug !== slug,
      revalidateFirstPage: false,
    });

  const flatData = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length < PAGE_SIZE) || !!error;

  const debouncedLoadMore = debounce(() => {
    setSize((num) => num + 1);
  }, 700);

  const updateConn = (recipientId: string, conn: UserConn, action: FollowAction) => {
    const updateData = (_data: UserConnection[]) => {
      const actions = [FollowAction.UNFOLLOW, FollowAction.ACCEPT, FollowAction.CANCEL, FollowAction.REJECT ]
      if(actions.includes(action)){
        return _data.filter((d) => d?.id !== recipientId);
      }
      else{
        return _data.map((d) => {
        if (d?.id === recipientId) {
          d = {
            ...d,
            conn: { ...d?.conn, ...conn },
          };
        }
        return d;
      });
      }
      
    };
    // update reposter
    mutate((_data) => _data?.map((_d) => updateData(_d)), {
      optimisticData: (_data) =>
        _data ? _data?.map((_d) => updateData(_d)) : [],
      revalidate: false,
      populateCache: true,
      rollbackOnError: true,
    });
  };

  const onFollowUser = (connUser: UserConnection, action: FollowAction) => {
    const conn = getFollowStatus(connUser.conn, connUser.meta, action);
    const recipientId = connUser.id
    updateConn(recipientId, conn, action );
    // send to api
    updateUserFollower({ senderId: user.id, recipientId, action }, token);
  };

  const filterMutate = (userId: string) => {
    mutate((_data) => _data?.map((_d) => _d.filter(d => d.id !== userId)), {
      optimisticData: (_data) =>
        _data ? _data?.map((_d) => _d.filter(d => d.id !== userId)) : [],
      revalidate: false,
      populateCache: true,
      rollbackOnError: true,
    });
  }

  const onBlockUser = async(userId: string) => {
    filterMutate(userId)
    await blockUser(userId, token);
  };

  const onMuteUser = async(userId: string) => {
    filterMutate(userId)
    await muteUser(userId, token);
  };


  return (
    <Box sx={{ mx: 1 }}>
        {/* display 404 error */}
        {((error && !data) || (data && flatData.length === 0)) && <DisplayError status={error?.status ?? 404} message={getErrorMessage(error)} />}
        {/* display network content */}
      <Grid container spacing={1}>
        {flatData.length > 0 &&
          flatData?.map((item) => (
            <Grid size={{ lg: 6, md: 6, sm: 12, xs: 12 }} key={item.id}>
              <ConnectionCard
                key={item.id}
                item={item}
                slug={slug}
                onFollowUser={onFollowUser}
                onBlockUser={onBlockUser}
                onMuteUser={onMuteUser}
              />
            </Grid>
          )) }
      </Grid>
      <Box sx={{ my: 2, textAlign: "center" }}>
        {flatData.length >= PAGE_SIZE && (
          <Button
            size="small"
            disabled={isReachingEnd}
            loading={isLoading}
            onClick={(ev) => {
              ev.preventDefault();
              debouncedLoadMore();
            }}
            sx={{ borderRadius: 30, fontSize: 12, textTransform: "capitalize" }}
            variant="outlined"
          >
            Show more
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default DisplayClient;
