"use client";
import React, { useState } from "react";
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
import { useAuthSession, useTrackImpression } from "@/hooks";
import {
  composeTagText,
  formatDateTime,
  formatFeedNumber,
  formatRelativeTime,
  getSessionId,
} from "@/utils";
import QuickreplyOutlinedIcon from "@mui/icons-material/QuickreplyOutlined";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import BookmarkOutlinedIcon from "@mui/icons-material/BookmarkOutlined";
import IosShareOutlinedIcon from "@mui/icons-material/IosShareOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/navigation";
import AnimateLikeButton from "@/components/post/AnimateLikeButton";
import AuthorHoverPreview from "@/components/post/AuthorHoverPreview";
import DisplayFeedMedia from "@/components/post/DisplayFeedMedia";
import DisplayMessage from "@/components/post/DisplayMessage";
import DisplayQuizItem from "@/components/post/DisplayQuizItem";
import DisplayTagMentionDrawer from "@/components/post/DisplayTagMentionDrawer";
import FeedQuoteItem from "@/components/post/FeedQuoteItem";
import PostOptions from "@/components/post/PostOptions";
import PostTipDrawer from "@/components/post/PostTipDrawer";
import RepostPopover from "@/components/post/RepostPopover";
import RollingNumber from "@/components/post/RollingNumber";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import { FeedPost, PostAuthor, PostKind, PostType } from "@/types";
import DisplayPollItem from "@/components/post/DisplayPollItem";
import { useNotifications } from "@toolpad/core";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";

import Link from "next/link";
import { trackUserProfileVisit } from "@/lib/users";
import {
  PostMetricAction,
  PostMetricSource,
  PostTagMention,
} from "@/types/post";
import { sendPostClick } from "@/lib/posts";
import { FollowAction, UserConnection } from "@/types/user";
import { getFollowAction, getUserConnInfo } from "@/utils/connections";
import LoyaltyOutlinedIcon from "@mui/icons-material/LoyaltyOutlined";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";

import PostText from "@/components/post/PostText";

type LocalState = {
  isOpen: boolean;
  openTagUserDrawer: boolean;
  slug: PostTagMention;
  users: UserConnection[];
  title?: string;
  muted: boolean;
};

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
  onFollowUserCallback: (args: {
    senderId: string;
    recipientId: string;
    action: FollowAction;
  }) => void;
}) => {
  const router = useRouter();

  const [state, setState] = useState<LocalState>({
    isOpen: false,
    openTagUserDrawer: false,
    slug: PostTagMention.TAG_USERS,
    users: [],
    muted: true,
  });

  const { user, token } = useAuthSession();

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );

  const openRepost = Boolean(anchorEl);

  const onClosePopover = () => {
    setAnchorEl(null);
  };

  const toggleTipDrawer = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    open: boolean
  ) => {
    ev.stopPropagation();
    ev.preventDefault();
    setState((prev) => ({ ...prev, isOpen: open }));
  };

  const toggleTagUserDrawer = (
    ev:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.MouseEvent<HTMLDivElement, MouseEvent>,
    open: boolean
  ) => {
    ev.stopPropagation();
    ev.preventDefault();
    setState((prev) => ({ ...prev, openTagUserDrawer: open }));
  };

  // menu options
  const [openMenu, setOpenMenu] = React.useState(false);
  const anchorMenuRef = React.useRef<HTMLButtonElement>(null);

  const onToggleOptionsMenu = () => {
    setOpenMenu((prevOpen) => !prevOpen);
  };

  const onCloseOptionsMenu = (event: Event | React.SyntheticEvent) => {
    if (
      anchorMenuRef.current &&
      anchorMenuRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setOpenMenu(false);
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpenMenu(false);
    } else if (event.key === "Escape") {
      setOpenMenu(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(openMenu);
  React.useEffect(() => {
    if (prevOpen.current === true && openMenu === false) {
      anchorMenuRef.current!.focus();
    }

    prevOpen.current = openMenu;
  }, [openMenu]);

  const sendPostClickLog = (action: PostMetricAction) => {
    if (user.id !== item?.userId) {
      const sessionId = getSessionId();
      sendPostClick(
        {
          id: item.id,
          action,
          source: PostMetricSource.PAGEVIEW,
          timestamp: new Date().toISOString(),
          sessionId,
        },
        token
      );
    }
  };

  const handlePost = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
    item: FeedPost
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    router.push(`/${item?.author?.username}/feed/${item.id}`);
  };

  const redirectToProfile = (user: PostAuthor) => {
    router.push(`/@${user.username}`);
  };

  const handleFollowUser = (recipientId: string, action: FollowAction) => {
    onFollowUserCallback({ senderId: user.id, recipientId, action });
  };

  const handleToggleTip = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.stopPropagation();
    toggleTipDrawer(ev, true);
  };

  const trackProfileVisit = (
    ev: React.MouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>,
    author: PostAuthor
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (user.id !== author.id) {
      const sessionId = getSessionId();
      trackUserProfileVisit(
        { postId: item.id, userId: author.id, sessionId },
        token
      );
      sendPostClickLog(PostMetricAction.PROFILE);
      // sessionStorage.setItem('tz_p_v', JSON.stringify({postId: item.id, userId: author.id}));
    }
  };

  const onToggleMuteAction = () => {
    setState((prev) => ({ ...prev, muted: false }));
  };

  const notif = useNotifications();

  const item = post.kind === PostKind.REPOST ? post.parent : post;

  const isDeleted = !!item.deletedAt;

  // check if the current author is followed by the current reader
  const isFollowed =
    user.id === item.author.id || item?.author?.conn?.isFollowedByUser;
  const { isFriends } = getUserConnInfo(item?.author?.conn);

  const quotedPost =
    post.kind === PostKind.QUOTE
      ? post.parent
      : post?.parent?.kind === PostKind.QUOTE
        ? post?.parent?.parent
        : undefined;
  // track post thread or reply impression
  const ref = useTrackImpression(item.id, 5);

  if (item.actions.isRootBlockedByUser || item.actions.isBlockedByUser) {
    return (
      <DisplayMessage
        actionHandler={() => redirectToProfile(item.author)}
        showActionBtn={true}
        btnText="Unblock"
        message="You can't view this at the moment. You have blocked the author"
      />
    );
  }

  if (item.actions.hasBlockedByRootUser || item.actions.hasBlockedUser) {
    return (
      <DisplayMessage message="You can't view this at the moment. You have been blocked by the author" />
    );
  }

  if (state.muted && item.actions.isMutedByUser) {
    return (
      <DisplayMessage
        message="You have muted this user"
        actionHandler={onToggleMuteAction}
        btnText="View"
        showActionBtn={true}
      />
    );
  }

  return (
    <React.Fragment>
      <Card
        ref={ref}
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
            // pb: 0.5,
            // px: 0.5,
            p: 1,
            borderBottom: `0.1px solid #eaeaec`,
            // borderTop: `0.1px solid #eaeaec`,
            ...theme.applyStyles("dark", {
              borderBottom: `0.1px solid #1c1c20ff`,
              // borderTop: `0.1px solid #1c1c20ff`,
            }),
            //   cursor: "pointer",
          }),
        ]}
        // onClick={(ev) => handlePost(ev, item)}
      >
        <CardContent
          sx={{
            maxWidth: "100%",
            "&:last-child": { pb: 0 },
            mt: 0,
            ml: 0,
            mr: 0,
            p: 1,
          }}
        >
          {post.kind === PostKind.REPOST && (
            <Stack direction={"row"} sx={{ alignItems: "center", ml: 3 }}>
              <RepeatOutlinedIcon
                sx={{
                  height: 14,
                  width: 14,
                  transform: "rotate(90deg)",
                  color: (theme) => theme.vars.palette.text.disabled,
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

          {!isDeleted && (
            <Stack direction={"row"}>
              <Box>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    !isFollowed && (
                      <IconButton
                        onClick={(ev) => {
                          ev.stopPropagation();
                          handleFollowUser(
                            item.userId,
                            getFollowAction(
                              isFriends,
                              item?.author?.conn?.followedStatus
                            )
                          );
                          // handleFollowUser(
                          //   item.userId,
                          //   !item.author.conn.isFollowedByUser
                          // );
                        }}
                        size="small"
                      >
                        <AddCircleOutlinedIcon sx={{ width: 16, height: 16 }} />
                      </IconButton>
                    )
                  }
                >
                  <Box onClick={(ev) => trackProfileVisit(ev, item.author)}>
                    <Link href={`/@${item?.author?.username}`}>
                      <Avatar
                        sx={{
                          height: 50,
                          width: 50,
                          border: (theme) =>
                            `4px solid ${theme.vars.palette.background.paper}`,
                        }}
                        alt={item?.author?.name}
                        src={item?.author?.avatar}
                        // onClick={(ev) => redirectToProfile(ev, item.author)}
                      />
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
                <Stack onClick={(ev) => trackProfileVisit(ev, item?.author)}>
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
                <Box onClick={(ev) => ev.stopPropagation()}>
                  <Tooltip title="Options" placement="top">
                    <IconButton
                      onClick={(ev) => onToggleOptionsMenu()}
                      size="small"
                      aria-label="Options"
                      ref={anchorMenuRef}
                      id="composition-button"
                      aria-controls={openMenu ? "composition-menu" : undefined}
                      aria-expanded={openMenu ? "true" : undefined}
                      aria-haspopup="true"
                    >
                      <MoreVertIcon
                        sx={{
                          height: 20,
                          width: 20,
                          color: (theme) => theme.vars.palette.text.disabled,
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                  <PostOptions
                    item={item}
                    handleClose={onCloseOptionsMenu}
                    handleListKeyDown={handleListKeyDown}
                    open={openMenu}
                    anchorRef={anchorMenuRef}
                    handleBookmark={handleBookmark}
                    handleFollowUser={handleFollowUser}
                  />
                </Box>
              </Stack>
            </Stack>
          )}
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
                {isDeleted && (
                  <Typography
                    sx={{ py: 4 }}
                    textAlign={"center"}
                    color="textDisabled"
                  >
                    This content is not available.
                  </Typography>
                )}
                {!isDeleted && (
                  <React.Fragment>
                    <PostText
                      disablePadding={true}
                      content={item?.content?.trim()}
                    />
                    {/* tagged users */}
                    <Stack
                      direction={{ lg: "row", md: "row", sm: "row", xs: "row" }}
                      justifyContent={"space-between"}
                      spacing={1}
                    >
                      {item?.tagUsers?.length > 0 && (
                        <Stack
                          direction={"row"}
                          alignItems={"center"}
                          spacing={0.5}
                          sx={{ pt: 0.5, cursor: "pointer" }}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            setState((prev) => ({
                              ...prev,
                              users: item.tagUsers,
                              openTagUserDrawer: true,
                              slug: PostTagMention.TAG_USERS,
                              title: "Tagged Users",
                            }));
                          }}
                        >
                          <LoyaltyOutlinedIcon
                            sx={{
                              color: "text.disabled",
                              width: 12,
                              height: 12,
                            }}
                          />
                          <Typography
                            color="textDisabled"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 1, // Number of lines before truncating
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              maxWidth: "100%", // Ensures it adapts to container width
                            }}
                            variant="caption"
                          >
                            {composeTagText(item?.tagUsers)}
                          </Typography>
                        </Stack>
                      )}
                      {/* {(item?.tagUsers?.length > 0 && item?.mentions?.length > 0) && <Divider orientation="horizontal" variant="inset"  />} */}
                      {item?.mentions?.length > 0 && (
                        <Stack
                          direction={"row"}
                          alignItems={"center"}
                          spacing={0.5}
                          sx={{ pt: 0.5, cursor: "pointer" }}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            setState((prev) => ({
                              ...prev,
                              users: item.mentions,
                              openTagUserDrawer: true,
                              slug: PostTagMention.MENTIONS,
                              title: "Mentions",
                            }));
                          }}
                        >
                          <AlternateEmailOutlinedIcon
                            sx={{
                              color: "text.disabled",
                              width: 12,
                              height: 12,
                            }}
                          />
                          <Typography
                            color="textDisabled"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 1, // Number of lines before truncating
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              maxWidth: "100%", // Ensures it adapts to container width
                            }}
                            variant="caption"
                          >
                            {composeTagText(item?.mentions)}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
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
                        marginTop: 1,
                      }}
                    >
                      {item.type === PostType.POLL && (
                        <DisplayPollItem fullwidth post={item} />
                      )}
                      {item.type === PostType.QUIZ && (
                        <DisplayQuizItem fullwidth post={item} />
                      )}
                      {item.media.length > 0 && (
                        <DisplayFeedMedia
                          post={item}
                          autoPlay={item.media.length === 1}
                          muted={false}
                        />
                      )}
                    </Box>
                  </React.Fragment>
                )}
                {/* quoted post */}
                {quotedPost && (
                  <FeedQuoteItem
                    post={quotedPost}
                    onFollowUserCallback={onFollowUserCallback}
                    showViewMuteBtn={true}
                  />
                )}
                {/* post analytics */}
                {!isDeleted && (
                  <Box>
                    <Stack
                      direction={{
                        lg: "row",
                        md: "row",
                        sm: "column",
                        xs: "column",
                      }}
                      sx={{ py: 0.5 }}
                    >
                      <Stack
                        direction={"row"}
                        sx={{ alignItems: "center" }}
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
                      </Stack>
                      <Stack
                        direction={"row"}
                        sx={{ alignItems: "center" }}
                        spacing={0.3}
                      >
                        <Typography
                          sx={{
                            display: {
                              lg: "block",
                              md: "block",
                              sm: "none",
                              xs: "none",
                            },
                            position: "relative",
                          }}
                          variant="caption"
                          color="textDisabled"
                        >
                          •
                        </Typography>
                      </Stack>
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
                        <Typography
                          sx={{ display: "block", position: "relative" }}
                          variant="caption"
                          color="textDisabled"
                        >
                          •
                        </Typography>
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
                    </Stack>
                  </Box>
                )}
                {/* action buttons */}
                {!isDeleted && (
                  <Stack
                    direction={"row"}
                    sx={{
                      position: "relative",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 0,
                      mx: 0,
                      maxWidth: "100%",
                    }}
                  >
                    <Tooltip title="Reply" placement="top">
                      <Stack
                        direction={"row"}
                        sx={{
                          alignItems: "center",
                          color: (theme) => theme.vars.palette.text.disabled,
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
                              color: (theme) =>
                                theme.vars.palette.text.disabled,
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
                          color: (theme) => theme.vars.palette.text.disabled,
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
                          color: (theme) => theme.vars.palette.text.disabled,
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
                          color: (theme) => theme.vars.palette.text.disabled,
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
                              color: (theme) =>
                                theme.vars.palette.text.disabled,
                            }}
                          />
                        </IconButton>
                        <RollingNumber number={item?.totalImpressions} />
                      </Stack>
                    </Tooltip>
                    <Tooltip title="Bookmark" placement="top">
                      <Stack
                        direction={"row"}
                        sx={{
                          alignItems: "center",
                          color: (theme) => theme.vars.palette.text.disabled,
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
                                color: (theme) =>
                                  theme.vars.palette.text.disabled,
                              }}
                            />
                          ) : (
                            <BookmarkOutlinedIcon
                              sx={{
                                height: 16,
                                width: 16,
                                color: (theme) => theme.vars.palette.info.main,
                                transition: "color 0.3s ease",
                              }}
                            />
                          )}
                        </IconButton>
                        <RollingNumber number={item?.totalBookmarks} />
                      </Stack>
                    </Tooltip>

                    <Tooltip title="Thanks" placement="top">
                      <Stack
                        direction={"row"}
                        sx={{
                          alignItems: "center",
                          // justifyContent: "center",
                          color: (theme) => theme.vars.palette.text.disabled,
                        }}
                        spacing={-0.7}
                      >
                        <IconButton onClick={(ev) => handleToggleTip(ev)}>
                          <MonetizationOnOutlinedIcon
                            sx={{
                              height: 16,
                              width: 16,
                              color: (theme) =>
                                theme.vars.palette.text.disabled,
                            }}
                          />
                        </IconButton>
                        <RollingNumber number={item?.totalTips} />
                      </Stack>
                    </Tooltip>
                    <Tooltip title="Share" placement="top">
                      <Stack
                        direction={"row"}
                        sx={{
                          alignItems: "center",
                          // justifyContent: "center",
                          color: (theme) => theme.vars.palette.text.disabled,
                        }}
                        spacing={-0.7}
                      >
                        <IconButton onClick={(ev) => handleShare(ev, item)}>
                          <IosShareOutlinedIcon
                            sx={{
                              height: 16,
                              width: 16,
                              color: (theme) =>
                                theme.vars.palette.text.disabled,
                            }}
                          />
                        </IconButton>
                        <RollingNumber number={item?.totalShares} />
                      </Stack>
                    </Tooltip>
                  </Stack>
                )}
              </Box>
            </Grid>
          </Grid>
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
      {/* post tip drawer */}
      <PostTipDrawer
        post={item}
        isOpen={state.isOpen}
        toggleDrawer={toggleTipDrawer}
      />
      {/* tag users drawer */}
      {state.openTagUserDrawer && (
        <DisplayTagMentionDrawer
          users={state.users}
          title={state.title}
          postId={item.id}
          slug={state.slug}
          isOpen={state.openTagUserDrawer}
          toggleDrawer={toggleTagUserDrawer}
        />
      )}
    </React.Fragment>
  );
};

export default FeedCardItem;
