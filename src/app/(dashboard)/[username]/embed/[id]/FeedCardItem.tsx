"use client";
import React from "react";
import Box from "@mui/material/Box";
import {
  Avatar,
  Badge,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useAuthSession } from "@/hooks";
import { formatDateTime, formatFeedNumber, formatRelativeTime } from "@/utils";
import QuickreplyOutlinedIcon from "@mui/icons-material/QuickreplyOutlined";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import BookmarkOutlinedIcon from "@mui/icons-material/BookmarkOutlined";
import IosShareOutlinedIcon from "@mui/icons-material/IosShareOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/navigation";
import AnimateLikeButton from "@/components/post/AnimateLikeButton";
import AuthorHoverPreview from "@/components/post/AuthorHoverPreview";
import DisplayFeedMedia from "@/components/post/DisplayFeedMedia";
import DisplayQuizItem from "@/components/post/DisplayQuizItem";
import FeedQuoteItem from "@/components/post/FeedQuoteItem";
import RepostPopover from "@/components/post/RepostPopover";
import RollingNumber from "@/components/post/RollingNumber";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import { FeedPost, PostAuthor, PostKind, PostType } from "@/types";
import DisplayPollItem from "@/components/post/DisplayPollItem";
import PostText from "@/components/post/PostText";
import { useNotifications } from "@/providers/NotificationsProvider";
import { appUrl } from "@/config";
import Link from "next/link";


const FeedCardItem = ({
  post,

}: {
  isRadius?: boolean;
  post: FeedPost;
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
    router.push(`${appUrl}/${item?.author?.username}/feed/${item.id}`);
  };

  const redirectToProfile = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
    user: PostAuthor
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    router.push(user.id === user?.id ? `/profile` : `/@${user.username}`);
  };

  const item = post.kind === PostKind.REPOST ? post.parent : post;

  const quotedPost =
    post.kind === PostKind.QUOTE
      ? post.parent
      : post?.parent?.kind === PostKind.QUOTE
        ? post?.parent?.parent
        : undefined;
  const postUrl = `${appUrl}/${item?.author?.username}/feed/${item.id}`
  return (
    <React.Fragment>
      <Card
        key={item.id}
        id={item.id}
        elevation={0}
        sx={[
          (theme) => ({
            borderRadius: 3,
            m: 2,
            borderBottom: `0.1px solid #eaeaec`,
            ...theme.applyStyles("dark", {
              borderBottom: `0.1px solid #46454d`,
            }),
          }),
        ]}
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
                  undefined
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
              <Link
                  style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center", minHeight: 24, minWidth: 24 }}
                  href={`${appUrl}/@${item?.author?.username}`}
                  target="_blank"
                >
                  <Stack direction={"row"} sx={{ alignItems: "center" }}>
                    <Typography sx={{ fontWeight: "bold" }} variant="subtitle1">
                      {item?.author?.name}
                    </Typography>
                    <IconButton aria-label="Verified account"
                      disableFocusRipple
                      disableRipple
                      disableTouchRipple
                      size="small"
                    >
                      <VerifiedIcon color="info" sx={{ width: 16, height: 16 }} />
                    </IconButton>
                  </Stack>
                </Link>

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
                  <Link
                    style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center", minHeight: 24, minWidth: 24 }}
                    href={`${appUrl}/@${item?.author?.username}`}
                    target="_blank"
                  >
                    <Typography
                      sx={{ display: "block" }}
                      color="textDisabled"
                      variant="caption"
                    >
                      @{item?.author?.username}
                    </Typography>
                  </Link>

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
          <Grid container spacing={0}>
            <Grid size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
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
                <Link href={postUrl} target="_blank" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
                <PostText
                  disablePadding={true}
                  content={item?.content?.trim()}
                />
                </Link>
                {/* repost */}
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
                    <DisplayFeedMedia post={item} autoPlay={true} muted={false} />
                  )}
                </Box>
                {/* quoted post */}
                {quotedPost && <FeedQuoteItem post={quotedPost} onFollowUserCallback={() => {}} />}
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
                      <IconButton aria-label="Reply"
                        disabled={!item.actions.canReply}
                        
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
                      <IconButton aria-label="Repost"
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
                        {}
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
                      <IconButton aria-label="View post analytics"
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
                      <IconButton aria-pressed={!!item?.actions?.hasSaved} aria-label={item?.actions?.hasSaved ? "Unsave post" : "Save post"}
                        onClick={(ev) =>
                        {}
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
                      <IconButton aria-label="Share" onClick={(ev) => {}}>
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
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </React.Fragment>
  );
};

export default FeedCardItem;
