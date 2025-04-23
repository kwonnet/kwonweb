"use client";
import {
  Box,
  Button,
  CardMedia,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import React, { cache } from "react";
import { AppNotification } from "@/types";
import useSWRInfinite from "swr/infinite";
import NotificationCard from "./NotificationCard";
// import { getUserNotifications } from "@/lib/actions/notifications";
import { useSession } from "next-auth/react";


const PAGE_SIZE = 10;

type IFethArgs = {
  limit: number;
  skip: number;
  userId: string;
};

const fetcher = cache(async (args: IFethArgs): Promise<AppNotification[]> => {
  // const response = await getUserNotifications(args)
  // if (!response.data) {
  //   throw new Error(response.message);
  // }
  // return response.data;
  return []
})

const NotificationClient = ({items,
  close
}: {
    items: AppNotification[];
    close: () => void
}) => {
  const session = useSession()
  const getKey = (pageIndex: number, previousPageData?: AppNotification[]) => {
    if (pageIndex !== 0 && previousPageData && !previousPageData.length)
      return null; // Stop when no more data
    return { type: "notifications", userId: session?.data?.user?.id, limit: PAGE_SIZE, skip: pageIndex * PAGE_SIZE }
  };

  const { data, error, isLoading, isValidating, mutate, size, setSize } =
    useSWRInfinite(getKey, fetcher, {
      keepPreviousData: true,
      fallbackData: [items],
    });

  const flatData = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length === 0) || !!error;

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
      {!isLoading && flatData.length === 0 && (
        <Box sx={{}}>
          <Typography
            variant="h5"
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
            }}
          >
            <CardMedia image="/no-data.svg" component={"img"} />
          </Typography>
        </Box>
      )}
      <Grid container spacing={2} mt={2}>
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
