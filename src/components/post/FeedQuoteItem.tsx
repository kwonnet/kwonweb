"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { formatRelativeTime } from "@/utils";
import { useRouter } from "next/navigation";
import AuthorHoverPreview from "@/components/post/AuthorHoverPreview";
import DisplayFeedMedia from "@/components/post/DisplayFeedMedia";
import { FeedPost, PostAuthor, PostKind, User } from "@/types";
import { useAuthSession } from "@/hooks";
import PostText from "./PostText";
import { FollowAction } from "@/types/user";

const FeedQuoteItem = ({
  post,
  onFollowUserCallback,
  showViewMuteBtn
}: {
  post: FeedPost;
  showViewMuteBtn?: boolean
  onFollowUserCallback: (args: {
    senderId: string;
    recipientId: string;
    action: FollowAction;
  }) => void;
}) => {
  const router = useRouter();

  const { token, user } = useAuthSession();

  const [state, setState] = useState<{ muted: boolean }>({
    muted: true,
  });

  const handlePost = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
    item: FeedPost
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    router.push(`/${item?.author?.username}/feed/${item.id}`);
  };

  const redirectToProfile = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
    user: PostAuthor
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    router.push(`/@${user.username}`);
  };

  const item = post.kind === PostKind.REPOST ? post.parent : post;

  const isDeleted = !!item.deletedAt;

  const showPost =
    !isDeleted &&
    !item.actions.isRootBlockedByUser &&
    !item.actions.isBlockedByUser &&
    !item.actions.hasBlockedByRootUser &&
    !item.actions.hasBlockedUser &&
    !item.actions.isMutedByUser;

  return (
    <Card
      key={item.id}
      elevation={0}
      sx={[
        (theme) => ({
          borderRadius: 3,
          mt: 0.5,
          mb: 0,
          pt: 0,
          pb: 0,
          border: `0.1px solid #b6b6bc`,
          ...theme.applyStyles("dark", {
            border: `0.1px solid #46454d`,
          }),
          px: 0,
          cursor: "pointer",
        }),
      ]}
      onClick={(ev) => handlePost(ev, item)}
    >
      <CardContent
        sx={{
          p: 1.5,
          minWidth: 0,
          maxWidth: "100%",
          "&:last-child": { pb: 1.5 },
        }}
      >
        {!showPost && state.muted && (
          <Box>
            <Typography
              color="textDisabled"
              sx={{
                textAlign: "center",
                py: 3
              }}>
              {isDeleted
                ? "This content is not available."
                : item.actions.isRootBlockedByUser ||
                    item.actions.isBlockedByUser
                  ? "You can't view this at the moment. You have blocked the author"
                  : item.actions.hasBlockedByRootUser ||
                      item.actions.hasBlockedUser
                    ? "You can't view this at the moment. You have been blocked by the author"
                    : item.actions.isMutedByUser
                      ? "You have muted this user"
                      : ""}
            </Typography>
            {(state.muted && item.actions.isMutedByUser && showViewMuteBtn) && (
              <Box sx={{ textAlign: "center", display: "block" }}>
                <Button
                  onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    setState((prev) => ({ ...prev, muted: false }));
                  }}
                  sx={{ borderRadius: 30 }}
                  size="small"
                  variant="outlined"
                  color="inherit"
                >
                  View
                </Button>
              </Box>
            )}
          </Box>
        )}

        {(showPost || (!state.muted && item.actions.isMutedByUser)) && (
          <Grid container sx={{ minWidth: 0, rowGap: 1 }}>
            <Grid size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
              <Stack>
                <Stack direction={"row"} sx={{ alignItems: "center" }}>
                  <Avatar
                    sx={{
                      height: 35,
                      width: 35,
                      border: (theme) =>
                        `4px solid ${theme.vars.palette.background.paper}`,
                      cursor: "pointer",
                    }}
                    alt={item?.author?.name}
                    src={item?.author?.avatar}
                    onClick={(ev) => redirectToProfile(ev, item.author)}
                  />
                  <Stack onClick={(ev) => redirectToProfile(ev, item.author)}>
                    <AuthorHoverPreview
                      author={item?.author}
                      isName={true}
                      onFollowUserCallback={onFollowUserCallback}
                    />
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
                      <AuthorHoverPreview
                        author={item?.author}
                        onFollowUserCallback={onFollowUserCallback}
                      />

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
                        {formatRelativeTime(item?.createdAt)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
              <Box
                sx={{
                  mt: 0,
                  pt: 0,
                  pb: 0,
                  mb: 0,
                  width: "100%",
                  position: "relative",
                }}
              >
                <PostText
                  content={item?.content?.trim()}
                  disablePadding={true}
                />
                {/* <Typography sx={{ 
                  display: "-webkit-box",
                  WebkitLineClamp: item.media.length > 0 ? 4 : 8, // Number of lines before truncating
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  maxWidth: "100%", // Ensures it adapts to container width
                }} variant="body2">
                {item?.content}
              </Typography> */}
                <Box
                  onClick={(ev) => ev.stopPropagation()}
                  className="feed_item"
                  sx={{ position: "relative" }}
                >
                  {item.media.length > 0 && (
                    <DisplayFeedMedia
                      post={item}
                      height={250}
                      preview={false}
                    />
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedQuoteItem;
