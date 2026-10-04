"use client";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import Link from "next/link";
import { TrendingTopics } from "@/types";
import useSWR from "swr";
import { getSidebarTrends } from "@/lib/discover";
import { useAuthSession } from "@/hooks";
import { formatNumber } from "@/utils";


const SidebarTrendClient = ({trends, initialError = false}: { trends: TrendingTopics[]; initialError?: boolean }) => {
  const { token, user} = useAuthSession()
  const { data = [], error, isLoading } =
    useSWR({country: user?.country?.id, limit: 3, id: user?.id ?? "guest"}, ({id, ...rest}) => getSidebarTrends(rest, token), {
      keepPreviousData: false,
      refreshWhenOffline: false,
      revalidateOnReconnect: true,
      fallbackData: trends,
      revalidateOnMount: initialError,
      refreshInterval: 60000,
    });
  return (
    <Box
      sx={[
        (theme) => ({
          border: `1px solid ${theme.vars.palette.divider}`,
          mt: 1,
          borderRadius: 2,
        }),
      ]}
    >
      <Typography
        variant="h6"
        sx={{
          textAlign: "center",
          fontWeight: 600
        }}>
        Check What's happening
      </Typography>
      {data.length === 0 && <Typography color="text.secondary" sx={{ p: 2 }} role="status">
        {error || (initialError && isLoading) ? "Trending topics are temporarily unavailable." : "No public topics in the last 24 hours."}
      </Typography>}
      {data.slice(0,3).map((item, index) => (
        <Box key={item.trend} sx={{ margin: 1 }}>
          <Stack
            direction={"row"}
            sx={{
              justifyContent: "space-between",
              alignItems: "center"
            }}>
            <Typography
              color="textDisabled"
              variant="caption"
            >{`Trending in ${item.country}`}</Typography>
            <IconButton size="small">
              <MoreHorizOutlinedIcon />
            </IconButton>
          </Stack>
          <Typography variant="subtitle1">{item.trend}</Typography>
          <Typography
            color="textDisabled"
            variant="caption"
          >{`${formatNumber(item.posts)} Posts - ${formatNumber(item.users)} Users`}</Typography>
          <Divider />
        </Box>
      ))}
      <Box sx={{ textAlign: "center", display: "block", my: 1 }}>
        <Button
          sx={{ borderRadius: 30 }}
          LinkComponent={Link}
          href="/discover"
          variant="outlined"
        >
          See More
        </Button>
      </Box>
    </Box>
  );
};

export default SidebarTrendClient;
