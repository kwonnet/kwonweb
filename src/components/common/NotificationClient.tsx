"use client";
import {useSSEContext} from '@/context/SSEContext';
import {
  Box,
  Button,
  CardMedia,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import React, { cache, useEffect } from "react";
import { AppNotification } from "@/types";
import useSWRInfinite from "swr/infinite";
import NotificationCard from "./NotificationCard";
// import { getUserNotifications } from "@/lib/actions/notifications";
import { useSession } from "next-auth/react";
import DisplayError from "./DisplayError";
import { getErrorMessage } from "@/utils";
import { getUserNotifications } from "@/lib/users";
import { useAuthSession } from "@/hooks";

const PAGE_SIZE = 21;

type IFetchArgs = {
  limit: number;
  skip: number;
  userId: string;
};


const NotificationClient = ({items,
  close
}: {
    items?: AppNotification[];
    close: () => void
}) => {

  const {user, token} = useAuthSession()

  const getKey = (pageIndex: number, previousPageData?: AppNotification[]) => {
    if (!user?.id || !token) return null;
    if (pageIndex !== 0 && previousPageData && !previousPageData.length)
      return null; // Stop when no more data
    return { type: "notifications", userId: user.id, token, limit: PAGE_SIZE, page: pageIndex + 1 }
  };

  const { data, error, isLoading, isValidating, mutate, size, setSize } =
    useSWRInfinite(getKey, (args) => getUserNotifications({userId: args.userId, limit: args.limit, page: args.page}, args.token), {
      keepPreviousData: false,
      revalidateOnMount: true,
      revalidateAll: true,
      fallbackData: items ? [items] : items,
      errorRetryCount: 2
    });

  const {notificationRevision} = useSSEContext();
  useEffect(() => {
    if (user?.id && token && notificationRevision) void mutate();
  }, [notificationRevision, user?.id, token, mutate]);

  const flatData = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length < PAGE_SIZE) || !!error;

  return (
    <React.Fragment>
      {isLoading && flatData.length === 0 && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {(error && !data) && <DisplayError status={error?.status} message={getErrorMessage(error)} />}
      <Grid container spacing={2} sx={{
        mt: 2
      }}>
        {flatData.map((item) => (
          <Grid key={item.id} size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
            <NotificationCard item={item} close={close} />
          </Grid>
        ))}
      </Grid>
      {(flatData.length > 0 && flatData.length >= PAGE_SIZE) && (
        <Box sx={{ display: "block", textAlign: "center", my: 2 }}>
          <Button
            loading={isLoading}
            disabled={isReachingEnd || isLoading}
            onClick={() => setSize(size + 1)}
            variant="outlined"
          >
            Load More
          </Button>
        </Box>
      )}
    </React.Fragment>
  );
};

export default NotificationClient;
