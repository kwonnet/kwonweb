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
  Tooltip,
  Typography,
} from "@mui/material";
import { useAuthSession } from "@/hooks";
import { formatDateTime, formatFeedNumber, formatRelativeTime } from "@/utils";
import QuickreplyOutlinedIcon from "@mui/icons-material/QuickreplyOutlined";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import BookmarkOutlinedIcon from "@mui/icons-material/BookmarkOutlined";
import IosShareOutlinedIcon from "@mui/icons-material/IosShareOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/navigation";
import {
  AnimateLikeButton,
  AuthorHoverPreview,
  CreateReplyDrawer,
  DisplayFeedMedia,
  DisplayQuizItem,
  FeedQuoteItem,
  RepostPopover,
  RollingNumber,
} from "@/components/post";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import { FeedPost, PostAuthor, PostKind, PostType, User } from "@/types";
import DisplayPollItem from "@/components/post/DisplayPollItem";
import ContentEditor from "@/components/post/ContentEditor";
import { useNotifications } from "@toolpad/core";

function getTimeRemaining(targetDate: Date): string {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const difference = target - now;

  if (difference <= 0) return "";

  const seconds = Math.floor((difference / 1000) % 60);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));

  return `${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds remaining.`;
}

const FeedCardItem = ({
  post,
  handleReaction,
  handleRepost,
  handleShare,
  handleBookmark,
  handleReply,
  onQuote,
  onFollowUserCallback,
  scopeMessage,
  isRadius = true,
}: {
  isRadius?: boolean;
  scopeMessage?: string;
  post: FeedPost;
  handleReaction: (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
    liked: boolean
  ) => Promise<void>;
  handleRepost: (ev: any, id: string, reposted: boolean) => void;
  handleShare: (ev: any, item: FeedPost) => void;
  handleReply: (ev: any, item: FeedPost) => void;
  handleBookmark: (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
    saved: boolean
  ) => Promise<void>;
  onQuote: (id: string) => Promise<void>;
  onFollowUserCallback: (
    args: {
      senderId: string;
      recipientId: string;
    },
    isFollow: boolean
  ) => void;
}) => {
  const router = useRouter();

  const { user } = useAuthSession();

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );

  const openRepost = Boolean(anchorEl);

  const onClosePopover = () => {
    setAnchorEl(null);
  };

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
    router.push(user.id === user?.id ? `/profile` : `/@${user.username}`);
  };

  const handleFollowUser = (recipientId: string, isFollow: boolean) => {
    onFollowUserCallback({ senderId: user.id, recipientId }, isFollow);
  };

  const notif = useNotifications();

  const item = post.kind === PostKind.REPOST ? post.parent : post;

  // check if the current author is followed by the current reader
  const isFollowed =
    user.id === item.author.id || item?.author?.conn?.isFollowed;

  const quotedPost =
    post.kind === PostKind.QUOTE
      ? post.parent
      : post?.parent?.kind === PostKind.QUOTE
        ? post?.parent?.parent
        : undefined;

  return (
    <React.Fragment>
      <Card
        key={item.id}
        id={item.id}
        elevation={0}
        sx={[
          (theme) => ({
            borderRadius: 0,
            // borderRadius: isRadius ? 3 : 0,
            // borderBottomRightRadius
            mt: 0,
            mb: 0,
            pt: 0,
            pb: 0.5,
            px: 0.5,
            borderBottom: `0.1px solid #eaeaec`,
            ...theme.applyStyles("dark", {
              borderBottom: `0.1px solid #46454d`,
            }),
            //   cursor: "pointer",
          }),
        ]}
        // onClick={(ev) => handlePost(ev, item)}
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
          {post.kind === PostKind.REPOST && (
            <Stack direction={"row"} sx={{ alignItems: "center", ml: 3 }}>
              <RepeatOutlinedIcon
                sx={{
                  height: 14,
                  width: 14,
                  transform: "rotate(90deg)",
                  color: (theme) => theme.palette.text.disabled,
                }}
              />
              <Typography
                sx={{
                  fontFamily: "PlayFair",
                  position: "relative",
                  display: "block",
                  py: -2,
                  my: -2,
                }}
                variant="body2"
                color="textDisabled"
              >
                {post?.author.name} reposted
              </Typography>
            </Stack>
          )}

          <Stack direction={"row"}>
            <Box>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                badgeContent={
                  !isFollowed && (
                    <IconButton
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleFollowUser(
                          item.userId,
                          !item.author.conn.isFollowed
                        );
                      }}
                      size="small"
                    >
                      <AddCircleOutlinedIcon sx={{ width: 24, height: 24 }} />
                    </IconButton>
                  )
                }
              >
                <Avatar
                  sx={{
                    height: 50,
                    width: 50,
                    border: (theme) =>
                      `4px solid ${theme.palette.background.paper}`,
                  }}
                  alt={item?.author?.name}
                  src={item?.author?.avatar}
                  onClick={(ev) => redirectToProfile(ev, item.author)}
                />
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
              <Box>
                <IconButton size="small" aria-label="Options">
                  <MoreVertIcon
                    sx={{
                      height: 20,
                      width: 20,
                      color: (theme) => theme.palette.text.disabled,
                    }}
                  />
                </IconButton>
              </Box>
            </Stack>
          </Stack>
          <Grid2 container spacing={0}>
            <Grid2 size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
              <Box
                sx={{
                  pt: 0,
                  pb: 0,
                  mb: 0,
                  width: "100%",
                  position: "relative",
                  pl: 1,
                  mt: 0,
                }}
              >
                <ContentEditor
                  disablePadding={true}
                  readOnly={true}
                  content={item?.content?.trim()}
                />
                {item.type === PostType.POLL && item?.poll?.isMultiVote && (
                  <Typography
                    color="textDisabled"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 4, // Number of lines before truncating
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      maxWidth: "100%", // Ensures it adapts to container width
                      fontStyle: "italic",
                    }}
                    variant="caption"
                  >
                    You can select multiple options
                  </Typography>
                )}
                <Box
                  onClick={(ev) => ev.stopPropagation()}
                  className="feed_item"
                  sx={{
                    position: "relative",
                    marginBottom: quotedPost ? 1 : 0,
                  }}
                >
                  {item.type === PostType.POLL && (
                    <DisplayPollItem fullwidth post={item} />
                  )}
                  {item.type === PostType.QUIZ && (
                    <DisplayQuizItem fullwidth post={item} />
                  )}
                  {item.media.length > 0 && (
                    <DisplayFeedMedia media={item.media} />
                  )}
                </Box>
                {/* quoted post */}
                {quotedPost && <FeedQuoteItem post={quotedPost} onFollowUserCallback={onFollowUserCallback} />}
                {/* post analytics */}
                <Box sx={{}}>
                  <Stack
                    direction={"row"}
                    sx={{ alignItems: "center", py: 0.5 }}
                    spacing={0.3}
                  >
                    <Typography
                      sx={{ display: "block" }}
                      color="textDisabled"
                      variant="caption"
                    >
                      {formatDateTime(post?.createdAt)}
                    </Typography>

                    <Typography
                      sx={{ display: "block", position: "relative" }}
                      variant="caption"
                      color="textDisabled"
                    >
                      •
                    </Typography>
                    <Typography
                      sx={{ display: "block" }}
                      color="textDisabled"
                      variant="caption"
                    >
                      {formatFeedNumber(post?.totalViews)}
                    </Typography>
                    <Typography
                      sx={{ display: "block", position: "relative" }}
                      variant="caption"
                      color="textDisabled"
                    >
                      Views
                    </Typography>
                    <Typography
                      sx={{ display: "block", position: "relative" }}
                      variant="caption"
                      color="textDisabled"
                    >
                      •
                    </Typography>

                    <Typography
                      sx={{ display: "block" }}
                      color="textDisabled"
                      variant="caption"
                    >
                      {formatFeedNumber(post?.totalLikes)}
                    </Typography>
                    <Typography
                      sx={{ display: "block", position: "relative" }}
                      variant="caption"
                      color="textDisabled"
                    >
                      Likes
                    </Typography>
                    <Typography
                      sx={{ display: "block", position: "relative" }}
                      variant="caption"
                      color="textDisabled"
                    >
                      •
                    </Typography>
                    <Stack
                      direction={"row"}
                      sx={{ alignItems: "center" }}
                      spacing={0.3}
                    >
                      <Typography
                        sx={{
                          display: "block",
                        }}
                        variant="caption"
                      >
                        {formatFeedNumber(post?.totalBookmarks)}
                      </Typography>
                      <Typography
                        sx={{ display: "block", position: "relative" }}
                        variant="caption"
                        color="textDisabled"
                      >
                        Bookmarks
                      </Typography>
                    </Stack>
                    <Typography
                      sx={{ display: "block", position: "relative" }}
                      variant="caption"
                      color="textDisabled"
                    >
                      •
                    </Typography>
                    <Typography
                      sx={{ display: "block" }}
                      color="textDisabled"
                      variant="caption"
                    >
                      {formatFeedNumber(post?.totalReplies)}
                    </Typography>
                    <Typography
                      sx={{ display: "block", position: "relative" }}
                      variant="caption"
                      color="textDisabled"
                    >
                      Replies
                    </Typography>
                    <Typography
                      sx={{ display: "block", position: "relative" }}
                      variant="caption"
                      color="textDisabled"
                    >
                      •
                    </Typography>
                    <Typography
                      sx={{ display: "block" }}
                      color="textDisabled"
                      variant="caption"
                    >
                      {formatFeedNumber(post?.totalShares)}
                    </Typography>
                    <Typography
                      sx={{ display: "block", position: "relative" }}
                      variant="caption"
                      color="textDisabled"
                    >
                      Shares
                    </Typography>
                    <Typography
                      sx={{ display: "block", position: "relative" }}
                      variant="caption"
                      color="textDisabled"
                    >
                      •
                    </Typography>
                    <Stack
                      direction={"row"}
                      sx={{ alignItems: "center" }}
                      spacing={0.3}
                    >
                      <Typography
                        sx={{
                          display: "block",
                        }}
                        variant="caption"
                      >
                        {formatFeedNumber(post?.totalReposts)}
                      </Typography>
                      <Typography
                        sx={{ display: "block", position: "relative" }}
                        variant="caption"
                        color="textDisabled"
                      >
                        Reposts
                      </Typography>
                    </Stack>
                    <Typography
                      sx={{ display: "block", position: "relative" }}
                      variant="caption"
                      color="textDisabled"
                    >
                      •
                    </Typography>
                    <Stack
                      direction={"row"}
                      sx={{ alignItems: "center" }}
                      spacing={0.3}
                    >
                      <Typography
                        sx={{
                          display: "block",
                        }}
                        variant="caption"
                      >
                        {formatFeedNumber(post?.totalQuotes)}
                      </Typography>
                      <Typography
                        sx={{ display: "block", position: "relative" }}
                        variant="caption"
                        color="textDisabled"
                      >
                        Quotes
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
                {/* action buttons */}
                <Stack
                  direction={"row"}
                  sx={{
                    position: "relative",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 0,
                    mx: 0,
                    left: -9,
                    maxWidth: "100%",
                  }}
                >
                  <Tooltip title="Reply" placement="top">
                    <Stack
                      direction={"row"}
                      sx={{
                        alignItems: "center",
                        color: (theme) => theme.palette.text.disabled,
                      }}
                      spacing={-0.7}
                    >
                      <IconButton
                        disabled={!item.actions.canReply}
                        onClick={(ev) => {
                          if (!item.actions.canReply) {
                            return notif.show(scopeMessage, {
                              autoHideDuration: 3000,
                              severity: "warning",
                            });
                          }
                          handleReply(ev, item);
                        }}
                      >
                        <QuickreplyOutlinedIcon
                          sx={{
                            height: 16,
                            width: 16,
                            color: (theme) => theme.palette.text.disabled,
                          }}
                        />
                      </IconButton>
                      <RollingNumber number={item?.totalReplies} />
                    </Stack>
                  </Tooltip>
                  <Tooltip title="Repost" placement="top">
                    <Stack
                      direction={"row"}
                      sx={{
                        alignItems: "center",
                        color: (theme) => theme.palette.text.disabled,
                      }}
                      spacing={-0.7}
                    >
                      <IconButton
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setAnchorEl(ev.currentTarget);
                        }}
                      >
                        <RepeatOutlinedIcon
                          sx={{
                            height: 16,
                            width: 16,
                            transform: "rotate(90deg)",
                            color: (theme) =>
                              item.actions.hasReposted
                                ? theme.vars.palette.success.light
                                : theme.vars.palette.text.disabled,
                          }}
                        />
                      </IconButton>
                      <RollingNumber
                        number={item?.totalReposts + item?.totalQuotes}
                      />
                    </Stack>
                  </Tooltip>
                  <Tooltip title="Like" placement="top">
                    <Stack
                      direction={"row"}
                      sx={{
                        alignItems: "center",
                        color: (theme) => theme.palette.text.disabled,
                      }}
                      spacing={-0.7}
                    >
                      <AnimateLikeButton
                        liked={item.actions.hasLiked}
                        handleReaction={(ev) =>
                          handleReaction(ev, item.id, !item.actions.hasLiked)
                        }
                      />
                      <RollingNumber number={item?.totalLikes} />
                    </Stack>
                  </Tooltip>
                  <Tooltip title="View" placement="top">
                    <Stack
                      direction={"row"}
                      sx={{
                        alignItems: "center",
                        color: (theme) => theme.palette.text.disabled,
                      }}
                      spacing={-0.7}
                    >
                      <IconButton
                        color="default"
                        disableFocusRipple
                        disableTouchRipple
                        disableRipple
                      >
                        <BarChartOutlinedIcon
                          sx={{
                            height: 16,
                            width: 16,
                            color: (theme) => theme.palette.text.disabled,
                          }}
                        />
                      </IconButton>
                      <RollingNumber number={item?.totalViews} />
                    </Stack>
                  </Tooltip>
                  <Tooltip title="Bookmark" placement="top">
                    <Stack
                      direction={"row"}
                      sx={{
                        alignItems: "center",
                        color: (theme) => theme.palette.text.disabled,
                      }}
                      spacing={-0.7}
                    >
                      <IconButton
                        onClick={(ev) =>
                          handleBookmark(ev, item.id, !item.actions.hasSaved)
                        }
                      >
                        {!item.actions.hasSaved ? (
                          <BookmarkBorderOutlinedIcon
                            sx={{
                              height: 16,
                              width: 16,
                              color: (theme) => theme.palette.text.disabled,
                            }}
                          />
                        ) : (
                          <BookmarkOutlinedIcon
                            sx={{
                              height: 16,
                              width: 16,
                              color: (theme) => theme.palette.info.main,
                              transition: "color 0.3s ease",
                            }}
                          />
                        )}
                      </IconButton>
                      <RollingNumber number={item?.totalBookmarks} />
                    </Stack>
                  </Tooltip>
                  <Tooltip title="Share" placement="top">
                    <Stack
                      direction={"row"}
                      sx={{
                        alignItems: "center",
                        // justifyContent: "center",
                        color: (theme) => theme.palette.text.disabled,
                      }}
                      spacing={-0.7}
                    >
                      <IconButton onClick={(ev) => handleShare(ev, item)}>
                        <IosShareOutlinedIcon
                          sx={{
                            height: 16,
                            width: 16,
                            color: (theme) => theme.palette.text.disabled,
                          }}
                        />
                      </IconButton>
                      <RollingNumber number={item?.totalShares} />
                    </Stack>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid2>
          </Grid2>
        </CardContent>
        <RepostPopover
          open={openRepost}
          anchorEl={anchorEl}
          onClose={onClosePopover}
          hasReposted={item.actions.hasReposted}
          onRepost={(ev) => {
            setAnchorEl(null);
            handleRepost(ev, item.id, !item.actions.hasReposted);
          }}
          onQuote={(ev) => {
            setAnchorEl(null);
            onQuote(item.id);
          }}
          onViewQuotes={(ev) => {
            router.push(`/${item.author.username}/feed/${item.id}/quotes`);
            setAnchorEl(null);
          }}
        />
      </Card>
    </React.Fragment>
  );
};

export default FeedCardItem;
