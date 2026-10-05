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


const PageClient = ({ trends }: { trends: TrendingTopics[] }) => {
  const { token, user } = useAuthSession()
  const { data, error, isLoading, mutate } =
    useSWR({ country: null, limit: 50, id: user.id }, ({ id, ...rest }) => getTrendingTopics(rest, token), {
      keepPreviousData: true,
      refreshWhenOffline: false,
      revalidateOnReconnect: true,
      fallbackData: trends,
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
        Discover What's Trending Now!
      </Typography>
      <Grid container spacing={1}>
      {data.map((item, index) => (
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
              color="textDisabled"
              variant="caption"
            >{`${index + 1} . Trending in ${item.country}`}</Typography>
            <IconButton size="small">
              <MoreHorizOutlinedIcon />
            </IconButton>
          </Stack>
          <Typography component={Link} href={searchHref(item.trend)} variant="subtitle1" sx={{ display: "block", color: "text.primary", textDecoration: "none", "&:hover": { color: "primary.main" } }}>{item.trend}</Typography>
          <Typography
            color="textDisabled"
            variant="caption"
          >{`${formatNumber(item.mentions)} Posts - ${formatNumber(item.users)} Users`}</Typography>
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
