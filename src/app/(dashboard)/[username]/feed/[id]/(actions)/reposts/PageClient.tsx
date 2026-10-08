"use client";
import { useAuthSession, useBadgeColor } from "@/hooks";
import { getPostReposts } from "@/lib/posts";
import { PostAuthor } from "@/types";
import { formatNumber, getErrorMessage, shortenText } from "@/utils";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { debounce } from "lodash";
import Link from "next/link";
import React, { useState } from "react";
import useSWRInfinite from "swr/infinite";
import VerifiedIcon from "@mui/icons-material/Verified";
import { updateUserFollower } from "@/lib/users";
import { getConnBtnColor, getConnBtnText } from "@/utils/post";
import { FollowAction, UserConn, UserConnection } from "@/types/user";
import { getConnBtnInfo, getFollowAction, getFollowStatus } from "@/utils/connections";
import DisplayError from "@/components/common/DisplayError";
import ConnectionCard from "@/components/sections/ConnectionCard";

const ReposterCard = ({
  item,
  onFollowUser,
}: {
  item: PostAuthor;
  onFollowUser: (recipientId: string, action: FollowAction) => void;
}) => {
  const [btnHover, setBtnHover] = useState(false);

  const { user } = useAuthSession();

  const isCurrentUser = user.id === item.id;

  const connBtn = getConnBtnInfo(item.conn, btnHover);

   const badgeColor = useBadgeColor(item?.meta?.color);

  return (
    <Paper sx={{ pb: 2, height: "100%", width: "100%", maxWidth: "100%" }}>
      <Stack
        direction={"row"}
        sx={{
          alignItems: "center",
          maxWidth: "100%",
          width: "100%"
        }}>
        <Box>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={
              item.meta.isPro && <IconButton size="small">
                <VerifiedIcon sx={{ width: 16, height: 16, color: badgeColor }} />
              </IconButton>
            }
            onClick={(ev) => ev.stopPropagation()}
          >
            <Link href={`/@${item?.username}`}>
              <Avatar
                sx={{
                  height: 60,
                  width: 60,
                  border: (theme) =>
                    `4px solid ${theme.vars.palette.background.paper}`,
                }}
                alt={item?.name}
                src={item?.avatar}
              />
            </Link>
          </Badge>
        </Box>
        <Stack
          direction={"row"}
          sx={{ justifyContent: "space-between" }}
        >
          <Stack direction={"column"}>
            <Typography
              sx={{
                textDecoration: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: '100%'
              }}
              color="textPrimary"
              variant="body2"
            >
              {item.name} caption space between james man
              {item?.meta?.isPro && (
                <IconButton size="small">
                  <VerifiedIcon
                    sx={{ width: 12, height: 12, color: badgeColor }}
                  />
                </IconButton>
              )}
            </Typography>

            <Typography
              sx={{
                textDecoration: "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              color="textDisabled"
              variant="caption"
            >
              @{item.username}
            </Typography>
          </Stack>
          {!isCurrentUser && (
            <Box sx={{ p: 2 }}>
              <Button
                onClick={(ev) => {
                  ev.preventDefault();
                  onFollowUser(
                    item.id,
                    getFollowAction(false, item.conn.followedStatus)
                  );
                }}
                variant="outlined"
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                sx={{
                  borderRadius: 30,
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
                size="small"
                color={connBtn.btnColor}
              >
                {connBtn.btnText}
              </Button>
            </Box>
          )}
        </Stack>
      </Stack>

      <Box sx={{ px: 2, py: 1 }}>
        <Typography color="textDisabled" component={"p"} variant="caption">
          {shortenText(
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Deleniti ratione alias eveniet corporis rem saepe consectetur hic ipsam ea cum! Blanditiis deserunt totam",
            60
          )}{" "}
        </Typography>
        <Box sx={{ pt: 0.5 }}>
        <Stack direction={"row"} sx={{
          gap: 2
        }}>
          <Typography
            color="textSecondary"
            variant="caption"
            sx={{ textDecoration: "none" }}
            component={Link}
            href={`/${item.username}/network/followers`}
          >
            {formatNumber(item.conn.followerCount)} Followers
          </Typography>

          <Typography
            color="textSecondary"
            variant="caption"
            sx={{ textDecoration: "none" }}
            component={Link}
            href={`/${item.username}/network/following`}
          >
            {formatNumber(item.conn.followingCount)} Following
          </Typography>
        </Stack>
      </Box>
      </Box>
    </Paper>
  );
};

const PAGE_SIZE = 21;

export const PageClient = ({
  users,
  postId,
  initialFetchFailed = false,
}: {
  users: UserConnection[];
  initialFetchFailed?: boolean;
  postId: string;
}) => {
  const { token, user } = useAuthSession();

  const getKey = (pageIndex: number, previousPageData?: UserConnection[]) => {
    if (pageIndex !== 0 && previousPageData && !previousPageData.length)
      return null; // Stop when no more data
    return {
      type: "post-reposts",
      id: postId,
      userId: user.id,
      limit: PAGE_SIZE,
      page: pageIndex + 1,
    };
  };

  const { data, error, isLoading, isValidating, size, mutate, setSize } =
    useSWRInfinite(getKey, (args) => getPostReposts(args, token), {
      keepPreviousData: true,
      refreshWhenOffline: false,
      fallbackData: [users],
      revalidateOnMount: initialFetchFailed,
      revalidateFirstPage: false,
    });

  const postReposters = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length < PAGE_SIZE) || !!error;

  const debouncedLoadMore = debounce(() => {
    setSize((num) => num + 1);
  }, 700);

  const updateConn = (recipientId: string, conn: UserConn, action: FollowAction) => {
    const updateData = (_data: UserConnection[]) => {
      return _data.map((d) => {
        if (d?.id === recipientId) {
            const statuses = [FollowAction.ACCEPT, FollowAction.FOLLOW]
            const increment = !d?.meta?.isPrivate && statuses.includes(action)
            const decrement = action === FollowAction.UNFOLLOW
            const followerCount = d.conn.followerCount
          return {
            ...d,
            conn: {
                ...d.conn,
                ...conn,
                followerCount: increment ? followerCount + 1 : decrement ? followerCount - 1 : followerCount,
            }
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
    const recipientId = connUser.id
    // mutate for current user
    updateConn(recipientId, conn, action );
    // send to api
    updateUserFollower({ senderId: user.id, recipientId, action }, token);

  }

  return (
    <Box sx={{ px: 1 }}>
      {error && !data && (
        <DisplayError status={error?.status} message={getErrorMessage(error)} />
      )}
      <Grid container spacing={1} sx={{
        mt: 1
      }}>
        {postReposters.length > 0 &&
          postReposters?.map((item) => (
            <Grid size={{ lg: 6, md: 6, sm: 12, xs: 12 }} key={item.id}>
              <ConnectionCard
                key={item.id}
                item={item}
                onFollowUser={onFollowUser}
                raised={true}
                mini={false}
              />
            </Grid>
          ))}
      </Grid>
      <Box sx={{ my: 2, textAlign: "center" }}>
        {postReposters.length >= PAGE_SIZE && (
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

export default PageClient;
