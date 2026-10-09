"use client";
import { searchHref } from "@/utils/post-text";
import {
  Box,
  Button,
  Divider,
  Grid,
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


const PageClient = ({ trends, topic }: { trends: TrendingTopics[]; topic?: string }) => {
  const { token, user } = useAuthSession()
  const { data, error, mutate } =
    useSWR({ mode: topic ? undefined : "foryou" as const, topic, limit: 50, id: user?.id ?? "guest" }, ({ id, ...rest }) => getTrendingTopics(rest, token), {
      keepPreviousData: true,
      refreshWhenOffline: false,
      revalidateOnReconnect: true,
      fallbackData: trends,
      revalidateOnMount: false,
    });
  return (
    <Box
    sx={{mt: 1}}
    >
      <Typography
        variant="h6"
        sx={{
          textAlign: "center",
          fontWeight: 600
        }}>
        {topic ? `${topic === "arts & culture" ? "Arts & Culture" : topic[0].toUpperCase() + topic.slice(1)} trends` : "Explore What's Happening Around You!"}
      </Typography>

      {error && <Typography color="error" sx={{ my: 2 }}>Unable to load trends. <Button onClick={() => void mutate()}>Retry</Button></Typography>}
      {!error && !data?.length && <Typography color="text.secondary" sx={{ my: 2 }}>No recent trends{topic ? ` in ${topic}` : ''} yet. Check back as new posts are published.</Typography>}
      <Grid container spacing={1}>
      {(data ?? []).map((item, index) => (
        <Grid key={index} size={{xs: 12, md: 12, lg: 6, xl: 6}} sx={[
          (theme) => ({
            border: `1px solid ${theme.vars.palette.divider}`,
            mt: 1,
            borderRadius: 2,
          }),
        ]}>
          <Box sx={{ margin: 1 }}>
          <Stack
            direction={"row"}
            sx={{
              justifyContent: "space-between",
              alignItems: "center"
            }}>
            <Typography
              color="text.secondary"
              variant="caption"
            >{`${index + 1} . Trending in ${item.country}`}</Typography>
            <IconButton aria-label="More options" size="small">
              <MoreHorizOutlinedIcon />
            </IconButton>
          </Stack>
          <Typography component={Link} href={searchHref(item.trend)} variant="subtitle1" sx={{ display: "block", color: "text.primary", textDecoration: "none", "&:hover": { color: "primary.main" } }}>{item.trend}</Typography>
          <Typography
            color="text.secondary"
            variant="caption"
          >{`${formatNumber(item.last_24_posts)} Posts - ${formatNumber(item.last_24_users)} Users in the last 24 hours`}</Typography>
          {/* <Divider /> */}
        </Box>
        </Grid>
      ))}
      </Grid>
      {/* <Box sx={{ textAlign: "center", display: "block", my: 1 }}>
        <Button
          sx={{ borderRadius: 30 }}
          LinkComponent={Link}
          href="/discover"
          variant="outlined"
        >
          See More
        </Button>
      </Box> */}
    </Box>
  );
};

export default PageClient;
