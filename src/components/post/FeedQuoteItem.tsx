"use client";
import React from "react";
import Box from "@mui/material/Box";
import {
  Avatar,
  Badge,
  Card,
  CardContent,
  Grid2,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { formatRelativeTime } from "@/utils";
import { useRouter } from "next/navigation";
import { AuthorHoverPreview, DisplayFeedMedia } from "@/components/post";
import { FeedPost, PostAuthor, PostKind, User } from "@/types";
import { useAuthSession } from "@/hooks";
import ContentEditor from "./ContentEditor";

const FeedQuoteItem = ({ post, onFollowUserCallback }: { post: FeedPost, onFollowUserCallback: (args: {
  senderId: string;
  recipientId: string;
}, isFollow: boolean) => void }) => {
  const router = useRouter();

  const { token, user } = useAuthSession();

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
    router.push(
      user.id === user?.id ? `/profile` : `/profile/@${user.username}`
    );
  };

  const item = post.kind === PostKind.REPOST ? post.parent : post;

  return (
    <Card
      key={item.id}
      elevation={0}
      sx={[
        (theme) => ({
          borderRadius: 3,
          mt: 0,
          mb: 0,
          pt: 0,
          pb: 0,
          border: `0.1px solid #b6b6bc`,
          ...theme.applyStyles("dark", {
            border: `0.1px solid #46454d`,
          }),
          px: 1,
          cursor: "pointer",
        }),
      ]}
      onClick={(ev) => handlePost(ev, item)}
    >
      <CardContent
        sx={{
          pt: 0.3,
          mt: 0,
          ml: 0,
          mr: 0,
          p: 0,
          maxWidth: "100%",
          "&:last-child": { pb: 0 },
        }}
      >
        <Grid2 container>
          <Grid2 size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
            <Stack>
              <Stack direction={"row"} sx={{ alignItems: "center" }}>
                <Avatar
                  sx={{
                    height: 35,
                    width: 35,
                    border: (theme) =>
                      `4px solid ${theme.palette.background.paper}`,
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
          </Grid2>
          <Grid2 size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
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
              <ContentEditor
                content={item?.content?.trim()}
                disablePadding={true}
                readOnly={true}
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
                  <DisplayFeedMedia media={item.media} />
                )}
              </Box>
            </Box>
          </Grid2>
        </Grid2>
      </CardContent>
    </Card>
  );
};

export default FeedQuoteItem;
