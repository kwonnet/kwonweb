"use client";
import React, { memo } from "react";
import Box from "@mui/material/Box";
import {
  Avatar,
  Badge,
  Card,
  CardContent,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { formatRelativeTime } from "@/utils";
import QuickreplyOutlinedIcon from "@mui/icons-material/QuickreplyOutlined";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import BookmarkOutlinedIcon from "@mui/icons-material/BookmarkOutlined";
import IosShareOutlinedIcon from "@mui/icons-material/IosShareOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/navigation";
import { DisplayFeedMedia, DisplayQuizItem } from "@/components/post";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import { FeedPost, PostAuthor, PostKind, PostType } from "@/types";
import FeedQuoteItem from "./FeedQuoteItem";
import DisplayPollItem from "./DisplayPollItem";
import { useAuthSession } from "@/hooks";
import ContentEditor from "./ContentEditor";
import RollingNumber from "./RollingNumber";
import AnimateLikeButton from "./AnimateLikeButton";
import RepostPopover from "./RepostPopover";
import AuthorHoverPreview from "./AuthorHoverPreview";

const FeedCardItem = ({
  post,
  handleReaction,
  handleRepost,
  handleShare,
  handleBookmark,
  onQuoteClick,
  onFollowUserCallback,
}: {
  post: FeedPost;
  handleReaction: (ev: any, id: string, liked: boolean) => void;
  handleRepost: (ev: any, id: string, reposted: boolean) => void;
  handleShare: (ev: any, item: FeedPost) => void;
  handleBookmark: (ev: any, id: string, saved: boolean) => void;
  onQuoteClick: (id: string) => Promise<void>;
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
    ev: React.MouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>,
    item: FeedPost
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    router.push(`/${item?.author?.username}/feed/${item.id}`);
  };

  const redirectToProfile = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
    author: PostAuthor
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    router.push(user.id === author?.id ? `/profile` : `/@${author.username}`);
  };

  const handleFollowUser = (recipientId: string, isFollow: boolean) => {
    onFollowUserCallback({ senderId: user.id, recipientId }, isFollow);
  };

  const item = post.kind === PostKind.REPOST ? post.parent : post;

  // check if the current reader is following the post author
  const isFollowed = user.id === item.author.id || item.author.conn.isFollowed;

  // console.log(item.hasLiked, item.totalLikes, item.id)

  const quotedPost =
    post.kind === PostKind.QUOTE
      ? post.parent
      : post?.parent?.kind === PostKind.QUOTE
        ? post?.parent?.parent
        : undefined;

  return (
    <Card
      key={item.id}
      sx={[
        (theme) => ({
          borderRadius: 3,
          mt: 0,
          mb: 1,
          pt: 0,
          pb: 0,
          px: 1,
          cursor: "pointer",
        }),
      ]}
      onClick={(ev) => {
        if (window.getSelection()?.toString()) {
          // Prevent navigation if text is selected
          return;
        }
        handlePost(ev, item);
      }}
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
        suppressHydrationWarning
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
              {post?.author?.id === user.id ? "You" : post?.author?.name}{" "}
              reposted
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
              onClick={(ev) => ev.stopPropagation()}
            >
              <Link href={`/@${item?.author?.username}`}>
                <Avatar
                  sx={{
                    height: 50,
                    width: 50,
                    border: (theme) =>
                      `4px solid ${theme.palette.background.paper}`,
                  }}
                  alt={item?.author?.name}
                  src={item?.author?.avatar}
                />
              </Link>
            </Badge>
          </Box>
          <Stack sx={{ width: "100%" }}>
            <Stack direction={"column"} sx={{ width: "100%" }}>
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
              {/* content here */}
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
                  sx={{ position: "relative", mt: 0.5 }}
                >
                  {item.type === PostType.POLL && (
                    <DisplayPollItem post={item} />
                  )}
                  {item.type === PostType.QUIZ && (
                    <DisplayQuizItem post={item} />
                  )}
                  {item.media.length > 0 && (
                    <DisplayFeedMedia media={item.media} />
                  )}
                </Box>
                {quotedPost && <FeedQuoteItem post={quotedPost} onFollowUserCallback={onFollowUserCallback} />}
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
                      <IconButton onClick={(ev) => handlePost(ev, item)}>
                        <QuickreplyOutlinedIcon
                          sx={{
                            height: 16,
                            width: 16,
                            color: (theme) => theme.palette.text.disabled,
                          }}
                        />
                      </IconButton>
                      <RollingNumber number={item?.totalReplies} />
                      {/* <Fade in={state.flipId === FlipperEnum.REPLY}> */}
                      {/* <Typography
                          sx={{
                            display: "block",
                          }}
                          variant="caption"
                        >
                          {formatFeedNumber(item?.totalReplies)}
                        </Typography> */}
                      {/* </Fade> */}
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
                              item?.actions.hasReposted
                                ? theme.vars.palette.success.light
                                : theme.vars.palette.text.disabled,
                          }}
                        />
                      </IconButton>
                      <RollingNumber
                        number={item?.totalReposts + item?.totalQuotes}
                      />
                      {/* <Typography
                          sx={{
                            display: "block",
                          }}
                          variant="caption"
                        >
                          {formatFeedNumber(
                            item?.totalReposts + item?.totalQuotes
                          )}
                        </Typography> */}
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
                        liked={item?.actions?.hasLiked}
                        handleReaction={(ev) =>
                          handleReaction(ev, item.id, !item?.actions?.hasLiked)
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
                        disableFocusRipple
                        disableTouchRipple
                        disableRipple
                        color="default"
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
                      {/* <Typography
                          sx={{
                            display: "block",
                          }}
                          variant="caption"
                        >
                          {formatFeedNumber(item?.totalViews)}
                        </Typography> */}
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
                          handleBookmark(ev, item.id, !item?.actions?.hasSaved)
                        }
                      >
                        {!item?.actions?.hasSaved ? (
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
                      {/* <Typography
                          sx={{
                            display: "block",
                          }}
                          variant="caption"
                        >
                          {formatFeedNumber(item?.totalBookmarks)}
                        </Typography> */}
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
                      {/* <Typography
                          sx={{
                            fontSize: "12px",
                          }}
                        >
                          {formatFeedNumber(item?.totalShares)}
                        </Typography> */}
                    </Stack>
                  </Tooltip>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
      <RepostPopover
        open={openRepost}
        anchorEl={anchorEl}
        onClose={onClosePopover}
        hasReposted={item?.actions?.hasReposted}
        onRepost={(ev) => {
          setAnchorEl(null);
          handleRepost(ev, item.id, !item?.actions?.hasReposted);
        }}
        onQuote={(ev) => {
          setAnchorEl(null);
          onQuoteClick(item.id);
        }}
        onViewQuotes={(ev) => {
          router.push(`/${item.author.username}/feed/${item.id}/quotes`);
          setAnchorEl(null);
        }}
      />
    </Card>
  );
};

export default memo(FeedCardItem);
