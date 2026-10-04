"use client";
import { useAuthSession } from "@/hooks";
import { useAccountAnalytics, usePostAnalytics } from "@/lib/swrHooks";
import { AccountAnalytics } from "@/types/user";
import { formatNumber, formatRelativeTime } from "@/utils";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  Tab,
  Typography,
} from "@mui/material";
import React, { useRef, useState } from "react";
import { tabsClasses } from "@mui/material/Tabs";
import debounce from "lodash/debounce";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import Link from "next/link";
import { FeedPost, FeedPostDetail } from "@/types";
import PageHeader from "@/components/common/PageHeader";
import { useRouter } from "next/navigation";

import PostText from "@/components/post/PostText";

const DisplayTabs = ({
  items,
  activeItem,
  handleChange,
}: {
  items: {
    id: string;
    isPro: boolean;
  }[];
  activeItem: string;
  handleChange: (event: React.SyntheticEvent, newValue: string) => void;
}) => {
  return (
    <Box sx={{ typography: "body1" }}>
      <TabContext value={activeItem}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile={true}
            selectionFollowsFocus={true}
            aria-label={`user analytics duration items`}
            onChange={handleChange}
            sx={{
              [`& .${tabsClasses.scrollButtons}`]: {
                "&.Mui-disabled": { opacity: 0.3 },
              },
            }}
          >
            {items.map((tab) => (
              <Tab key={tab.id} label={tab.id} value={tab.id} />
            ))}
          </TabList>
        </Box>
      </TabContext>
    </Box>
  );
};

const PageClient = ({
  analytics,
  durationItems,
  postId,
  post,
}: {
  post: FeedPostDetail;
  postId: string;
  analytics: AccountAnalytics[];
  durationItems: {
    id: string;
    isPro: boolean;
  }[];
}) => {
  const { token, user } = useAuthSession();

  const [state, setState] = useState({ duration: durationItems[0].id });

  const router = useRouter();

  const { data, error, isLoading, mutate } = usePostAnalytics(
    { id: postId, analytics, duration: state.duration },
    token
  );

  const debounceMutate = useRef(
    debounce((val: string) => {
      console.log("refetching...", state.duration);
      setState((prev) => ({ ...prev, duration: val }));
      // mutate()
    }, 1000)
  ).current;

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    // setState((prev) => ({ ...prev, duration: newValue }));
    debounceMutate(newValue);
  };

  const onViewPost = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    router.push(`/${post?.author?.username}/feed/${post.id}`);
  };

  const onViewProfile = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    router.push(`/@${post.author.username}`);
  };

  return (
    <React.Fragment>
      <PageHeader
        title={<Typography variant="h6">Post Analytics</Typography>}
      />
      <Box sx={{ px: 1 }}>
        <Paper sx={{ p: 1 }}>
          <Stack direction={"row"}>
            <Box>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              >
                <Box>
                  <Link
                    style={{ textDecoration: "none", cursor: "pointer" }}
                    href={`/@${post?.author?.username}`}
                  >
                    <Avatar
                      sx={{
                        height: 50,
                        width: 50,
                        border: (theme) =>
                          `4px solid ${theme.vars.palette.background.paper}`,
                      }}
                      alt={post?.author?.name}
                      src={post?.author?.avatar}
                    >
                      {post?.author?.name[0]}
                    </Avatar>
                  </Link>
                </Box>
              </Badge>
            </Box>
            <Stack
              direction={"row"}
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Stack
                sx={{ cursor: "pointer" }}
                onClick={(ev) => onViewProfile(ev)}
              >
                <Stack
                  direction={"row"}
                  sx={{
                    position: "relative",
                    alignItems: "center",
                    mt: -1,
                    pt: -2,
                  }}
                  spacing={0.3}
                >
                  <Stack spacing={-1}>
                    <Typography>{post?.author?.name}</Typography>
                    <Stack direction={"row"} spacing={1}>
                      <Typography variant="caption" color="textDisabled">
                        @{post?.author?.username}
                      </Typography>
                      <Typography
                        sx={{ display: "block", position: "relative" }}
                        variant="caption"
                      >
                        •
                      </Typography>
                      <Typography
                        sx={{ display: "block" }}
                        color="textDisabled"
                        variant="caption"
                      >
                        {formatRelativeTime(post?.createdAt)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
          <Box
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 10, // Number of lines before truncating
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              maxWidth: "100%", // Ensures it adapts to container width
            }}
            onClick={(ev) => onViewPost(ev)}
          >
            <PostText
              content={post?.content}
              disablePadding={true}
            />
          </Box>
        </Paper>
        {/* <Typography
          variant="h6"
          sx={{ fontWeight: 800, py: 1, textAlign: "center" }}
        >
          Post Analytics
        </Typography> */}
        <Box sx={{ my: 1 }}>
          <DisplayTabs
            items={durationItems}
            activeItem={state.duration}
            handleChange={handleChange}
          />
        </Box>
        <Grid container spacing={2}>
          {data?.map((item) => {
            const downward = item.change?.includes("-");
            const upward = item.change?.includes("+");
            const changeText = item?.change?.replace("+", "").replace("-", "");
            const isEngagement = item.title
              ?.toLowerCase()
              .includes("engagement");
            return (
              <Grid key={item.title} size={{ lg: 3, md: 3, sm: 6, xs: 6 }}>
                <Paper sx={{ height: "100%", p: 1 }}>
                  <Typography color="textDisabled" variant="subtitle2">
                    {item.title}
                  </Typography>
                  <Stack direction={"row"} spacing={1}>
                    <Typography variant="h5">
                      {isEngagement
                        ? `${item.value}%`
                        : formatNumber(item.value)}
                    </Typography>
                    <Stack direction={"row"}>
                      {upward ? (
                        <TrendingUpOutlinedIcon
                          color="success"
                          sx={{
                            alignSelf: "end",
                          }}
                        />
                      ) : downward ? (
                        <TrendingDownOutlinedIcon
                          color="error"
                          sx={{
                            alignSelf: "end",
                          }}
                        />
                      ) : (
                        <SwapVertOutlinedIcon
                          sx={{
                            alignSelf: "end",
                          }}
                        />
                      )}
                      <Typography
                        variant="caption"
                        color={
                          upward ? "success" : downward ? "error" : undefined
                        }
                        alignSelf={"end"}
                      >
                        {changeText}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
        <Box sx={{ my: 2, display: "block", textAlign: "center" }}>
          <Typography variant="h4">
            {!user?.meta?.isPro &&
              "Become a premium user to get full post analytics insight"}
          </Typography>
          <Button
            LinkComponent={Link}
            href={
              user?.meta?.isPro
                ? `/@${user.username}/analytics-insight`
                : "/subscribe"
            }
            variant="outlined"
            size="large"
            sx={{ borderRadius: 30 }}
          >
            {user?.meta?.isPro ? "Get Full Insight" : "Subscribe"}
          </Button>
        </Box>
      </Box>
    </React.Fragment>
  );
};

export default PageClient;
