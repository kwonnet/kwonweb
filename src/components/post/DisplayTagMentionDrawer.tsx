"use client";
import {
  Box,
  Avatar,
  Container,
  FormControl,
  IconButton,
  TextField,
  Chip,
  Button,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  SwipeableDrawer,
  InputAdornment,
  Stack,
  CircularProgress,
  Divider,
  Grid,
} from "@mui/material";
import { ArrowBack, Close, Delete, SearchOutlined } from "@mui/icons-material";
import React, { useState, useEffect } from "react";
import { debounce } from "lodash";
import { searchUsers, updateUserFollower } from "@/lib/users";
import { useAuthSession } from "@/hooks";
import { PostTagMention, TagUser } from "@/types/post";
import { FollowAction, FollowResponse, FollowStatus, UserConn, UserConnection } from "@/types/user";
import ConnectionCard from "../sections/ConnectionCard";
import { useSSEContext } from "@/context/SSEContext";
import useSWRInfinite from "swr/infinite";
import { getPostTagUsersOrMentions } from "@/lib/posts";
import { getFollowStatus } from "@/utils/connections";
import StickyBox from "react-sticky-box";

const PAGE_SIZE = 21;

const DisplayTagMentionDrawer = ({
  isOpen,
  toggleDrawer,
  users,
  title,
  slug,
  postId,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  users: UserConnection[];
  title?: string;
  postId: string;
  slug: PostTagMention;
}) => {
  const open = React.useMemo(() => isOpen, [isOpen]);

  const { user, token } = useAuthSession();

  const getKey = (pageIndex: number, previousPageData?: UserConnection[]) => {
    if (pageIndex !== 0 && previousPageData && !previousPageData.length)
      return null; // Stop when no more data
    return {
      type: `tag_mention_${postId}_${slug}`,
      query: slug,
      id: postId,
      limit: PAGE_SIZE,
      page: pageIndex + 1,
    };
  };

  const { data, error, isLoading, isValidating, size, mutate, setSize } =
    useSWRInfinite(getKey, (args) => getPostTagUsersOrMentions(args, token), {
      keepPreviousData: false,
      refreshWhenOffline: false,
      errorRetryCount: 2,
      fallbackData: users.length > 0 ? [users] : undefined,
    });

  const flatData = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length < PAGE_SIZE) || !!error;

  const debouncedLoadMore = debounce(() => {
    setSize((num) => num + 1);
  }, 700);

  const updateConn = (
    recipientId: string,
    conn: UserConn,
    action: FollowAction
  ) => {
    const updateData = (_data: UserConnection[]) => {
      return _data.map((d) => {
        if (d?.id === recipientId) {
          const statuses = [FollowAction.ACCEPT, FollowAction.FOLLOW];
          const increment = !d?.meta?.isPrivate && statuses.includes(action);
          const decrement = action === FollowAction.UNFOLLOW;
          const followerCount = d.conn.followerCount;
          return {
            ...d,
            conn: {
              ...d.conn,
              ...conn,
              followerCount: increment
                ? followerCount + 1
                : decrement
                  ? followerCount - 1
                  : followerCount,
            },
          };
        }
        return d;
      });
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
    const recipientId = connUser.id;
    // console.log(`Followed: ${slug} `, "recipientId: ", recipientId, "conn: ",  conn)
    // mutate for current user
    updateConn(recipientId, conn, action);
    // send to api
    updateUserFollower({ senderId: user.id, recipientId, action }, token);
  };

  return (
    <SwipeableDrawer
      sx={{
        zIndex: 999999999,
        height: "100vh",
        overflow: "hidden",
      }}
      anchor={"bottom"}
      open={open}
      onClose={(ev) => toggleDrawer(ev, false)}
      onOpen={(ev) => {}}
      keepMounted={true}
      slotProps={{
        paper: {
          sx: {
            top: { lg: "50%", md: "50%", sm: "30%", xs: "30%" },
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            zIndex: 999,
            overflow: "auto",
            width: { lg: 600, md: 600, sm: "100%", width: "100%" },
            maxWidth: "100%",
            margin: "0 auto",
          },
        },
      }}
    >
      <Box sx={{ width: "auto" }} role="presentation" onClick={ev => ev.stopPropagation()}>
        <StickyBox style={{zIndex: 9999,}}>
            <Box
              sx={[
                (theme) => ({
                  width: "100%",
                  zIndex: 999999,
                  py: 1,
                  bgcolor: theme.vars.palette.AppBar.defaultBg,
                  ...theme.applyStyles("dark", {
                    bgcolor: theme.vars.palette.AppBar.darkBg,
                  }),
                }),
              ]}
            >
              <Stack
                direction={"row"}
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  mx: 1,
                  my: 1,
                }}
              >
                <IconButton aria-label="Close"
                  color="inherit"
                  onClick={(ev) => toggleDrawer(ev, false)}
                >
                  <Close />
                </IconButton>
                <Typography>{title}</Typography>
              </Stack>
          </Box>
        </StickyBox>
        <Container maxWidth="xl" sx={{ mt: 1, pb: 2 }}>
          <Grid container spacing={1}>
            {flatData.map((item) => (
              <Grid key={item.id} size={12}>
                <ConnectionCard
                  mini={false}
                  raised={true}
                  item={item}
                  onFollowUser={onFollowUser}
                />
              </Grid>
            ))}
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
                sx={{
                  borderRadius: 30,
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
                variant="outlined"
              >
                Show more
              </Button>
            )}
          </Box>
        </Container>
      </Box>
    </SwipeableDrawer>
  );
};

export default DisplayTagMentionDrawer;
