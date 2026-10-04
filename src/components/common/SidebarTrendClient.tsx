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
import { getTrendingTopics } from "@/lib/discover";
import { useAuthSession } from "@/hooks";
import { formatNumber } from "@/utils";


const SidebarTrendClient = ({trends}: { trends: TrendingTopics[]}) => {
  const { token, user} = useAuthSession()
  const { data, error, isLoading, mutate } =
    useSWR({country: user?.country?.id, limit: 50, id: user.id}, ({id, ...rest}) => getTrendingTopics(rest, token), {
      keepPreviousData: true,
      refreshWhenOffline: false,
      revalidateOnReconnect: true,
      fallbackData: trends,
      revalidateOnMount: false,
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
      <Typography textAlign={"center"} fontWeight={600} variant="h6">
        Check What's happening
      </Typography>
      {data.slice(0,3).map((item, index) => (
        <Box key={index} sx={{ margin: 1 }}>
          <Stack
            direction={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
          >
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
          >{`${formatNumber(item.mentions)} Posts - ${formatNumber(item.users)} Users`}</Typography>
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
