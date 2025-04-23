"use client";
import { useAuthSession } from "@/hooks";
import { getPostReposts } from "@/lib/posts";
import { PostAuthor } from "@/types";
import { shortenText } from "@/utils";
import {
  Avatar,
  Badge,
  Box,
  Button,
  CardMedia,
  Grid2,
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

const ReposterCard = ({
  item,
  onFollowUser,
}: {
  item: PostAuthor;
  onFollowUser: (recipientId: string, isFollow: boolean) => void;
}) => {
  const [btnHover, setBtnHover] = useState(false);

  const { user } = useAuthSession();
  const isCurrentUser = user.id === item.id;
  return (
    <Paper sx={{ pb: 2, height: "100%" }}>
      <Stack direction={"row"}>
        <Box>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={
              <IconButton size="small">
                <VerifiedIcon color="info" sx={{ width: 16, height: 16 }} />
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
                    `4px solid ${theme.palette.background.paper}`,
                }}
                alt={item?.name}
                src={item?.avatar}
              />
            </Link>
          </Badge>
        </Box>
        <Stack
          direction={"row"}
          sx={{ justifyContent: "space-between", width: "100%" }}
        >
          <Stack spacing={-1}>
            <Typography variant="subtitle1">{item.name}</Typography>
            <Typography color="textDisabled" variant="caption">
              @{item.username}
            </Typography>
          </Stack>
          {!isCurrentUser && (
            <Box sx={{ p: 2 }}>
              <Button
                onClick={(ev) => {
                    ev.preventDefault()
                    onFollowUser(item.id, !item.conn.isFollowed)
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
                color={getConnBtnColor(item,btnHover)}
              >
                {getConnBtnText(item, btnHover)}
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
      </Box>
    </Paper>
  );
};

const PAGE_SIZE = 21;

export const RepostsClient = ({
  users,
  postId,
}: {
  users: PostAuthor[];
  postId: string;
}) => {
  const { token, user } = useAuthSession();

  const getKey = (pageIndex: number, previousPageData?: PostAuthor[]) => {
    if (pageIndex !== 0 && previousPageData && !previousPageData.length)
      return null; // Stop when no more data
    return {
      type: "post_reposts",
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
      fallbackData: users.length > 0 ? [users] : undefined,
    });

  const postReposters = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length < PAGE_SIZE) || !!error;

  const debouncedLoadMore = debounce(() => {
    setSize((num) => num + 1);
  }, 700);

  const updatePoster = (recipientId: string, isFollow: boolean) => {
      const updateData = (_data: PostAuthor[]) => {
        return _data.map((d) => {
          if (d?.id === recipientId) {
            d = {
              ...d,
                conn: { ...d?.conn, isFollowed: isFollow },
            }
          }
          return d;
        });
      };
      // update reposter
      mutate(
        (_data) => _data?.map((_d) => updateData(_d)), 
        {
        optimisticData: (_data) => _data ? _data?.map((_d) => updateData(_d)) : [],
        revalidate: false,
        populateCache: true,
        rollbackOnError: true
      });
    }

  const onFollowUser = (
    recipientId: string,
    isFollow: boolean
  ) => {
    updatePoster(recipientId, isFollow)
    // send to api
    updateUserFollower({ senderId: user.id, recipientId }, token);
  };

  return (
    <Box>
      {postReposters?.length === 0 && (
        <Typography textAlign={"center"}>Not reposts yet</Typography>
      )}
      <Grid2 container spacing={1}>
        {postReposters.length > 0 &&
          postReposters?.map((item) => (
            <Grid2 size={{ lg: 6, md: 6 }} key={item.id}>
              <ReposterCard
                key={item.id}
                item={item}
                onFollowUser={onFollowUser}
              />
            </Grid2>
          ))}
      </Grid2>
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
