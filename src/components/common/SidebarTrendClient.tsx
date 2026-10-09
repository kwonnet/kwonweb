"use client";
import { searchHref } from "@/utils/post-text";
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
              color="text.secondary"
              variant="caption"
            >{`Trending in ${item.country}`}</Typography>
            <IconButton aria-label="More options" size="small">
              <MoreHorizOutlinedIcon />
            </IconButton>
          </Stack>
          <Typography component={Link} href={searchHref(item.trend)} variant="subtitle1" sx={{ display: "block", color: "text.primary", textDecoration: "none", "&:hover": { color: "primary.main" } }}>{item.trend}</Typography>
          <Typography
            color="text.secondary"
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
          Explore more trends
        </Button>
      </Box>
    </Box>
  );
};

export default SidebarTrendClient;
