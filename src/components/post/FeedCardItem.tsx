"use client";
import React, { memo, useState } from "react";
import Box from "@mui/material/Box";
import {
  Avatar,
  Badge,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  composeTagText,
  formatRelativeTime,
  getSessionId,
  shouldSendLog,
} from "@/utils";
import QuickreplyOutlinedIcon from "@mui/icons-material/QuickreplyOutlined";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import BookmarkOutlinedIcon from "@mui/icons-material/BookmarkOutlined";
import IosShareOutlinedIcon from "@mui/icons-material/IosShareOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/navigation";
import DisplayFeedMedia from "@/components/post/DisplayFeedMedia";
import DisplayQuizItem from "@/components/post/DisplayQuizItem";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import { FeedPost, PostAuthor, PostKind, PostType } from "@/types";
import FeedQuoteItem from "./FeedQuoteItem";
import DisplayPollItem from "./DisplayPollItem";
import { useAuthSession, useTrackImpression } from "@/hooks";
import RollingNumber from "./RollingNumber";
import AnimateLikeButton from "./AnimateLikeButton";
import RepostPopover from "./RepostPopover";
import AuthorHoverPreview from "./AuthorHoverPreview";
import PostOptions from "./PostOptions";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import { trackUserProfileVisit } from "@/lib/users";
import Link from "next/link";
import PostText from "./PostText";
import { requestGuestLogin } from "@/utils/guest-auth-trigger";
import { sendPostClick } from "@/lib/posts";
import { PostMetricAction, PostMetricSource, PostTagMention } from "@/types/post";
import dynamic from "next/dynamic";
const PostTipDrawer = dynamic(() => import("./PostTipDrawer"), { ssr: false });
import { FollowAction, UserConnection } from "@/types/user";
import { getFollowAction, getUserConnInfo } from "@/utils/connections";
import LoyaltyOutlinedIcon from "@mui/icons-material/LoyaltyOutlined";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import DisplayTagMentionDrawer from "./DisplayTagMentionDrawer";


type LocalState = {
    isOpen: boolean;
    openTagUserDrawer: boolean;
    slug: PostTagMention;
    users: UserConnection[];
    title?: string
}

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
  onFollowUserCallback: (args: {
    senderId: string;
    recipientId: string;
    action: FollowAction;
  }) => void;
}) => {
  const router = useRouter();

  const { user, token } = useAuthSession();

  const [state, setState] = useState<LocalState>({
    isOpen: false,
    openTagUserDrawer: false,
    slug: PostTagMention.TAG_USERS,
    users: []
  });

  const originalItem = post.kind === PostKind.REPOST ? post.parent : post;
  const item = originalItem.author.id === user?.id ? { ...originalItem, author: { ...originalItem.author,
    avatar: user.avatar || user.image || undefined, name: user.name || originalItem.author.name, username: user.username || originalItem.author.username,
  } } : originalItem;

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
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.MouseEvent<HTMLDivElement, MouseEvent>,
    open: boolean
  ) => {
    ev.stopPropagation();
    ev.preventDefault();
    setState((prev) => ({ ...prev, openTagUserDrawer: open }));
  };

  const sendPostClickLog = (action: PostMetricAction) => {
    if (token && user?.id !== item?.userId) {
      const sessionId = getSessionId();
      sendPostClick(
        {
          id: item.id,
          action,
          source: PostMetricSource.FORYOU,
          timestamp: new Date().toISOString(),
          sessionId,
        },
        token
      );
    }
  };

  const handlePost = (
    ev: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    sendPostClickLog(PostMetricAction.CONTENT);
    router.push(`/@${item?.author?.username}/feed/${item.id}`);
  };

  const trackProfileVisit = (
    ev: React.MouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>,
    author: PostAuthor
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (token && user?.id !== author.id) {
      const sessionId = getSessionId();
      trackUserProfileVisit(
        { postId: item.id, userId: author.id, sessionId },
        token
      );
      sendPostClickLog(PostMetricAction.PROFILE);
      // sessionStorage.setItem('tz_p_v', JSON.stringify({postId: item.id, userId: author.id}));
    }
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
      const canTrack = shouldSendLog(item.id, "POST_CLICK");
      if (canTrack) {
        sendPostClickLog(PostMetricAction.OPTION);
      }
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

  // handle follower
  const handleFollowUser = (recipientId: string, action: FollowAction) => {
    sendPostClickLog(PostMetricAction[action]);
    onFollowUserCallback({ senderId: user?.id, recipientId, action });
  };

  const handleToggleRepost = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.stopPropagation();
    setAnchorEl(ev.currentTarget);
    sendPostClickLog(PostMetricAction.REPOST);
  };

  const handleReply = (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    ev.stopPropagation();
    sendPostClickLog(PostMetricAction.REPLY);
    router.push(`/${item?.author?.username}/feed/${item.id}`);
  };

  const handleToggleTip = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.stopPropagation();
    toggleTipDrawer(ev, true);
    sendPostClickLog(PostMetricAction.TIP);
  };

  // check if the current reader is following the post author
  const isFollowed =
    user?.id === item.author.id || item.author.conn.isFollowedByUser;
  const { isFriends } = getUserConnInfo(item?.author?.conn);
  // console.log(item.hasLiked, item.totalLikes, item.id)
  // get tags
  const taggedUsers = [];
  const quotedPost =
    post.kind === PostKind.QUOTE
      ? post.parent
      : post?.parent?.kind === PostKind.QUOTE
        ? post?.parent?.parent
        : undefined;

  // track impressions after every 2 minutes
  const ref = useTrackImpression(item.id, 15);
  return (
    <Card
      ref={ref}
      className="newsfeed-card"
      component="article"
      onClickCapture={token ? undefined : (event) => {
        event.preventDefault(); event.stopPropagation(); requestGuestLogin();
      }}
      key={item.id}
      id={item.id}
      elevation={0}
      sx={[
        (theme) => ({
          borderRadius: 0,
          mt: 0,
          mb: 0,
          pt: 0,
          pb: 0,
          p: 0,
          cursor: "pointer",

          borderBottom: `0.1px solid #b9b9c9ff`,
          // background:
          //   segment === convoUser.id
          //     ? theme.vars.palette.AppBar.defaultBg
          //     : undefined,
          ...theme.applyStyles("dark", {
            borderBottom: `0.1px solid #2f2f39ff`,
            // background:
            //   segment === convoUser.id
            //     ? theme.vars.palette.AppBar.defaultBg
            //     : undefined,
          }),



          // boxShadow: theme.shadows[1],
          // ...theme.applyStyles("dark", {
          //   boxShadow: theme.shadows[8],
          // }),
        }),
      ]}
      onClick={(ev) => {
        if (window.getSelection()?.toString()) {
          // Prevent navigation if text is selected
          return;
        }
        handlePost(ev);
      }}
    >
      <CardContent
        sx={{
          p: 2,
          display: "grid",
          gridTemplateColumns: "45px minmax(0, 1fr)",
          columnGap: 1,
          rowGap: 0.5,
          maxWidth: "100%",
          minWidth: 0,
          "&:last-child": { pb: 2 },
        }}
        suppressHydrationWarning
      >
        {post.kind === PostKind.REPOST && (
          <Stack direction={"row"} sx={{ gridColumn: "1 / -1", alignItems: "center", gap: 0.5, mb: 0.5 }}>
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
                py: 0,
                my: 0,
              }}
              variant="body2"
              color="textDisabled"
            >
              {post?.author?.id === user?.id ? "You" : post?.author?.name}{" "}
              reposted
            </Typography>
          </Stack>
        )}
        <Stack direction={"row"} sx={{ display: "contents" }}>
          <Box>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              badgeContent={
                !isFollowed && (
                  <IconButton aria-label="Follow author"
                    onClick={(ev) => {
                      ev.preventDefault();
                      handleFollowUser(
                        item.userId,
                        getFollowAction(
                          isFriends,
                          item?.author?.conn?.followedStatus
                        )
                        // !item.author.conn.isFollowedByUser
                      );
                    }}
                    size="small"
                  >
                    <AddCircleOutlinedIcon sx={{ width: 16, height: 16 }} />
                  </IconButton>
                )
              }
              onClick={(ev) => ev.stopPropagation()}
            >
              <Box onClick={(ev) => trackProfileVisit(ev, item.author)}>
                <Link aria-label={`View ${item?.author?.name || 'user'} profile`} href={`/@${item?.author?.username}`}>
                  <Avatar
                    sx={{
                      height: 45,
                      width: 45,
                      border: (theme) =>
                        `4px solid ${theme.vars.palette.background.paper}`,
                    }}
                    alt={item?.author?.name}
                    src={item?.author?.avatar}
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
              flex: 1,
              minWidth: 0,
            }}
          >
            <Stack onClick={(ev) => trackProfileVisit(ev, item.author)}>
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
                  mt: 0,
                  pt: 0,
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
              {token && <PostOptions
                item={item}
                handleClose={onCloseOptionsMenu}
                handleListKeyDown={handleListKeyDown}
                open={openMenu}
                anchorRef={anchorMenuRef}
                handleBookmark={handleBookmark}
                handleFollowUser={handleFollowUser}
              />}
            </Box>
          </Stack>
        </Stack>

        {/* content here */}
        {/* <Grid container spacing={0}>
          <Grid size={{ lg: 12, md: 12, sm: 12, xs: 12 }}> */}
        <Box
          sx={{
            mt: 0,
            pt: 0,
            pb: 0,
            mb: 0,
            px: 0,
            gridColumn: 2,
            minWidth: 0,
            width: "100%",
            position: "relative",
          }}
        >
          <PostText
            disablePadding={true}
            content={item?.content?.trim()}
            key={item.id}
          />
          {/* tagged users */}
          <Stack
            direction={{ lg: "row", md: "row", sm: "row", xs: "row" }}
            spacing={1}
            sx={{
              justifyContent: "space-between"
            }}
          >
            {item?.tagUsers?.length > 0 && (
              <Stack
                direction={"row"}
                spacing={0.5}
                onClick={ev => {
                  ev.stopPropagation()
                  ev.preventDefault()
                  setState((prev) => ({ ...prev, users: item.tagUsers,  openTagUserDrawer: true, slug: PostTagMention.TAG_USERS, title: "Tagged Users" }));
                }}
                sx={{
                  alignItems: "center",
                  pt: 0.5,
                  cursor: "pointer"
                }}>
                <LoyaltyOutlinedIcon
                  sx={{ color: "text.disabled", width: 12, height: 12 }}
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
                spacing={0.5}
                onClick={ev => {
                  ev.stopPropagation()
                  ev.preventDefault()
                  setState((prev) => ({ ...prev, users: item.mentions,  openTagUserDrawer: true, slug: PostTagMention.MENTIONS, title: "Mentions" }));
                }}
                sx={{
                  alignItems: "center",
                  pt: 0.5,
                  cursor: "pointer"
                }}>
                <AlternateEmailOutlinedIcon
                  sx={{ color: "text.disabled", width: 12, height: 12 }}
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
            sx={{ position: "relative", mt: 0.5, mx: 0 }}
          >
            {item.type === PostType.POLL && <DisplayPollItem post={item} />}
            {item.type === PostType.QUIZ && <DisplayQuizItem post={item} />}
            {item.media.length > 0 && (
              <DisplayFeedMedia
                post={item}
                autoPlay={Boolean(token) && item.media.length === 1}
                preview={Boolean(token)}
              />
            )}
          </Box>

          {quotedPost && (
            <FeedQuoteItem
              post={quotedPost}
              onFollowUserCallback={onFollowUserCallback}
            />
          )}
          <Stack
            direction={"row"}
            sx={{
              position: "relative",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              mt: 1,
              rowGap: 0.5,
              "& .MuiIconButton-root": { px: { xs: 0.5, sm: 1 } },
              px: 0,
              mx: 0,
              maxWidth: "100%",
              width: "100%",
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
                <IconButton aria-label="Reply" onClick={(ev) => handleReply(ev)}>
                  <QuickreplyOutlinedIcon
                    sx={{
                      height: 16,
                      width: 16,
                      color: (theme) => theme.vars.palette.text.disabled,
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
                  color: (theme) => theme.vars.palette.text.disabled,
                }}
                spacing={-0.7}
              >
                <IconButton aria-label="Repost" onClick={(ev) => handleToggleRepost(ev)}>
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
                  color: (theme) => theme.vars.palette.text.disabled,
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
                  color: (theme) => theme.vars.palette.text.disabled,
                }}
                spacing={-0.7}
              >
                <IconButton aria-label="View post analytics"
                  disableFocusRipple
                  disableTouchRipple
                  disableRipple
                  color="default"
                >
                  <BarChartOutlinedIcon
                    sx={{
                      height: 16,
                      width: 16,
                      color: (theme) => theme.vars.palette.text.disabled,
                    }}
                  />
                </IconButton>
                <RollingNumber number={item?.totalImpressions} />
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
                  color: (theme) => theme.vars.palette.text.disabled,
                }}
                spacing={-0.7}
              >
                <IconButton aria-pressed={!!item?.actions?.hasSaved} aria-label={item?.actions?.hasSaved ? "Unsave post" : "Save post"}
                  onClick={(ev) =>
                    handleBookmark(ev, item.id, !item?.actions?.hasSaved)
                  }
                >
                  {!item?.actions?.hasSaved ? (
                    <BookmarkBorderOutlinedIcon
                      sx={{
                        height: 16,
                        width: 16,
                        color: (theme) => theme.vars.palette.text.disabled,
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
            <Tooltip title="Tip Author" placement="top">
              <Stack
                direction={"row"}
                sx={{
                  alignItems: "center",
                  // justifyContent: "center",
                  color: (theme) => theme.vars.palette.text.disabled,
                }}
                spacing={-0.7}
              >
                <IconButton aria-label="Tip Author" onClick={(ev) => handleToggleTip(ev)}>
                  <MonetizationOnOutlinedIcon
                    sx={{
                      height: 16,
                      width: 16,
                      color: (theme) => theme.vars.palette.text.disabled,
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
                <IconButton aria-label="Share" onClick={(ev) => handleShare(ev, item)}>
                  <IosShareOutlinedIcon
                    sx={{
                      height: 16,
                      width: 16,
                      color: (theme) => theme.vars.palette.text.disabled,
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
        {/* </Grid>
        </Grid> */}
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
      {/* post tip drawer */}
      {state.isOpen && <PostTipDrawer
        post={item}
        isOpen={state.isOpen}
        toggleDrawer={toggleTipDrawer}
      />}
      {/* tag users drawer */}
      {state.openTagUserDrawer && <DisplayTagMentionDrawer
        users={state.users}
        title={state.title}
        postId={item.id}
        slug={state.slug}
        isOpen={state.openTagUserDrawer}
        toggleDrawer={toggleTagUserDrawer}
      />}
    </Card>
  );
};

export default memo(FeedCardItem);
