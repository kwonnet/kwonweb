"use client";
import { useAuthSession, useBadgeColor } from "@/hooks";
import {
  FollowAction,
  FollowResponse,
  FollowStatus,
  UserAccountStatus,
  UserConnection,
  UserMiniProfile,
} from "@/types/user";
import {
  composeMutualText,
  formatDateTime,
  formatNumber,
  getCurrentSegment,
  getDateInfo,
  getErrorMessage,
} from "@/utils";
import { CalendarMonthOutlined, LocationOn } from "@mui/icons-material";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import VerifiedIcon from "@mui/icons-material/Verified";
import { getConnBtnInfo, getFollowStatus } from "@/utils/connections";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import NotificationAddOutlinedIcon from "@mui/icons-material/NotificationAddOutlined";
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import useSWR from 'swr';
import { subscribeUserToPush } from '@/utils/pushClient';
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import PersonRemoveAlt1OutlinedIcon from "@mui/icons-material/PersonRemoveAlt1Outlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import MoreTimeOutlinedIcon from "@mui/icons-material/MoreTimeOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import { blockUser, updateAccountState, updateUserFollower, getAuthorPostNotifications, setAuthorPostNotifications } from "@/lib/users";
import { getUserConnInfo } from "@/utils/connections";
import { useNotifications } from "@/providers/NotificationsProvider";
import PageHeader from "@/components/common/PageHeader";
import RequestPopover from "@/components/common/RequestPopover";
import { useSSEContext } from "@/context/SSEContext";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import ProfileOptions from "./ProfileOptions";
import { Lock, WarningOutlined } from "@mui/icons-material";

const getStatCaption = (
  stats: UserMiniProfile["stats"],
  segment?: string | null
) => {
  if (segment === "posts" || segment?.startsWith("@")) {
    return `${formatNumber(stats.totalPosts)} Posts`;
  }
  if (segment === "scheduled") {
    return `${formatNumber(stats.totalScheduled)} Posts`;
  }
  if (segment === "replies") {
    return `${formatNumber(stats.totalReplies)} Replies`;
  }
  if (segment === "bookmarks") {
    return `${formatNumber(stats.totalBookmarks)} Bookmarks`;
  }
  if (segment === "highlights") {
    return `${formatNumber(stats.totalHighlights)} Highlights`;
  }
  if (segment === "media") {
    return `${formatNumber(stats.totalMediaPosts)} Media`;
  }
  if (segment === "likes") {
    return `${formatNumber(stats.totalLikes)} Likes`;
  }
  return "";
};

const ProfileClient = (params: { user: UserMiniProfile }) => {
  const { user, token } = useAuthSession();

  const notif = useNotifications();

  const pathname = usePathname();

  const segment = getCurrentSegment(pathname);

  const [btnHover, setBtnHover] = useState(false);

  const { sseSource } = useSSEContext();

  const [state, setState] = useState({
    visitedUser: params.user,
    loading: false,
    segment,
  });

  const visitedUser = state.visitedUser;

  const isCurrentUser = user?.id === visitedUser?.id;
  const [notificationBusy, setNotificationBusy] = useState(false);
  const {data: postNotifications, error: notificationError, isLoading: notificationLoading, mutate: refreshPostNotifications} = useSWR(
    token && user?.id && visitedUser?.id && !isCurrentUser ? ['author-post-notifications', user.id, visitedUser.id, token] : null,
    () => getAuthorPostNotifications(visitedUser.id, token!),
  );
  const followsAuthor = visitedUser.conn?.followedStatus === FollowStatus.ACCEPTED;
  const notificationLabel = postNotifications?.subscribed ? 'Turn off post notifications' : followsAuthor ? 'Notify me about new posts' : 'Follow this user to enable post notifications';
  const togglePostNotifications = async () => {
    if (!token || notificationBusy || !postNotifications) return;
    setNotificationBusy(true);
    try {
      const enabled = !postNotifications.subscribed;
      if (enabled && !followsAuthor) return;
      // Request permission from the explicit bell click, never on profile load.
      const push = enabled ? await subscribeUserToPush(token) : null;
      const result = await setAuthorPostNotifications(visitedUser.id, enabled, token);
      await refreshPostNotifications(result, {revalidate: false});
      notif.show(enabled
        ? push?.status === 200 ? `Post notifications enabled for @${visitedUser.username}` : `Post notifications enabled in Kwonnet. ${push?.message}`
        : `Post notifications disabled for @${visitedUser.username}`, {
          severity: enabled && push?.status !== 200 ? 'warning' : 'success', autoHideDuration: 6000,
        });
    } catch (error) {
      notif.show(getErrorMessage(error), {severity: 'error', autoHideDuration: 5000});
    } finally {setNotificationBusy(false);}
  };

  const badgeColor = useBadgeColor(visitedUser?.meta?.color);

  const dob = visitedUser.dateOfBirth ? getDateInfo(visitedUser.dateOfBirth) : null;

  const { isConnected, isFriends } = getUserConnInfo(visitedUser?.conn);

  const isPrivate = visitedUser?.meta?.isPrivate;

  const isActive = visitedUser?.meta?.isActive;

  const disabled =
    (isPrivate && !isConnected) ||
    !visitedUser?.meta?.isActive ||
    isCurrentUser;

  const canView =
    (isPrivate && isConnected) || (isActive && !isPrivate) || isCurrentUser;

  const isSuspended = !isPrivate && !isActive;

  const isDeactivated =
    isCurrentUser && visitedUser?.meta?.accountStatus === "DEACTIVATED";

  const showPopoverBtn =
    visitedUser?.conn?.followingStatus === FollowStatus.PENDING;

  const getFollowAction = () => {
    return isFriends ||
      visitedUser?.conn?.followedStatus === FollowStatus.ACCEPTED
      ? FollowAction.UNFOLLOW
      : visitedUser?.conn?.followedStatus === FollowStatus.PENDING
        ? FollowAction.CANCEL
        : FollowAction.FOLLOW;
  };

  const onFollowUser = async (action: FollowAction) => {
    const previousConn = visitedUser.conn;
    const conn = getFollowStatus(visitedUser.conn, visitedUser.meta, action);

    setState((prev) => ({
      ...prev,
      visitedUser: {
        ...prev.visitedUser,
        conn: {
          ...prev.visitedUser.conn,
          ...conn,
        },
      },
    }));
    // send to api
    try {
      await updateUserFollower(
        { senderId: user.id, recipientId: visitedUser.id, action },
        token
      );
    } catch (error) {
      setState(prev => ({...prev, visitedUser: {...prev.visitedUser, conn: previousConn}}));
      notif.show(getErrorMessage(error), {severity: 'error', autoHideDuration: 5000});
      return;
    }
    if (action === FollowAction.UNFOLLOW || action === FollowAction.CANCEL) await refreshPostNotifications({subscribed: false}, {revalidate: false});
    await refreshPostNotifications().catch(error => notif.show(getErrorMessage(error), {severity: 'error', autoHideDuration: 5000}));
  };

  const onReactivateAccount = async (status: UserAccountStatus) => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const result = await updateAccountState(
        { userId: visitedUser.id, status },
        token
      );
      notif.show(
        `You account has been ${result.isActive ? "activated" : "deactivated"} successfully`,
        { severity: "success", autoHideDuration: 3000 }
      );
      setState((prev) => ({
        ...prev,
        loading: false,
        visitedUser: {
          ...prev.visitedUser,
          meta: {
            ...prev.visitedUser.meta,
            accountStatus: status,
            message: "",
          },
        },
      }));
      window.location.reload();
    } catch (error) {
      notif.show(getErrorMessage(error), {
        severity: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const onUnblockAccount = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const result = await blockUser(visitedUser?.id, token);
      notif.show(result.isBlocked ? "Account blocked " : "Account unblocked", {
        severity: "success",
        autoHideDuration: 3000,
      });
      setState((prev) => ({
        ...prev,
        loading: false,
        visitedUser: {
          ...prev.visitedUser,
          actions: {
            ...prev?.visitedUser?.actions,
            isBlockedByUser: result.isBlocked,
          },
        },
      }));
      if (!result.isBlocked) {
        window.location.reload();
      }
    } catch (error) {
      notif.show(getErrorMessage(error), {
        severity: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const onActionsUpdate = (actions: Partial<UserMiniProfile["actions"]>) => {
    setState((prev) => ({
      ...prev,
      loading: false,
      visitedUser: {
        ...prev.visitedUser,
        actions: {
          ...prev?.visitedUser?.actions,
          ...actions,
        },
      },
    }));
  };

  const onMetaUpdate = (meta: Partial<UserMiniProfile["meta"]>) => {
    setState((prev) => ({
      ...prev,
      loading: false,
      visitedUser: {
        ...prev.visitedUser,
        meta: {
          ...prev?.visitedUser?.meta,
          ...meta,
        },
      },
    }));
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
      // const canTrack = shouldSendLog(item.id, "POST_CLICK");
      // if (canTrack) {
      //   sendPostClickLog(PostMetricAction.OPTION);
      // }
      // return;
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

  const connBtn = getConnBtnInfo(visitedUser.conn, btnHover);

  // handle connection requests for private accounts - accept or reject

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );

  const open = Boolean(anchorEl);

  const onClosePopover = () => {
    setAnchorEl(null);
  };

  const onToggleRequest = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.stopPropagation();
    setAnchorEl(ev.currentTarget);
  };

  useEffect(() => {
    const listener = (ev: MessageEvent) => {
      const body: FollowResponse = JSON.parse(ev.data);
      const isUnfollow = body.action === FollowAction.UNFOLLOW;
      const isFollow =
        body.action === FollowAction.FOLLOW &&
        body.status === FollowStatus.ACCEPTED;
      const isAccepted = body.action === FollowAction.ACCEPT;
      if (
        user.id === body.senderId &&
        isFollow &&
        state?.visitedUser?.meta?.isPrivate
      ) {
        return window.location.reload();
      }
      // check if user profile
      if (body.senderId === visitedUser.id) {
        setState((prev) => {
          const conn = prev.visitedUser.conn;
          return {
            ...prev,
            visitedUser: {
              ...prev.visitedUser,
              conn: {
                ...conn,
                ...(isUnfollow && { followingCount: conn.followingCount - 1 }),
                ...(isFollow && { followingCount: conn.followingCount + 1 }),
                ...(isAccepted && { followerCount: conn.followerCount + 1 }),
              },
            },
          };
        });
      }
      if (body.recipientId === visitedUser.id) {
        setState((prev) => {
          const conn = prev.visitedUser.conn;
          return {
            ...prev,
            visitedUser: {
              ...prev.visitedUser,
              conn: {
                ...conn,
                ...(isUnfollow && { followerCount: conn.followerCount - 1 }),
                ...((isFollow || isAccepted) && {
                  followerCount: conn.followerCount + 1,
                }),
              },
            },
          };
        });
      }
    };
    sseSource?.addEventListener("user_follower", listener);
    return () => {
      sseSource?.removeEventListener("user_follower", listener);
    };
    // eslint-disable-next-line
  }, [sseSource]);

  useEffect(() => {
    const segment = getCurrentSegment(pathname);
    setState((prev) => ({ ...prev, segment }));
    return () => {};
  }, [pathname]);

  const statCaption = getStatCaption(visitedUser?.stats, state.segment);

  const isBlocked =
    visitedUser?.actions?.hasBlockedUser ||
    visitedUser?.actions?.isBlockedByUser;

  const isMutuallyBlocked =
    visitedUser?.actions?.hasBlockedUser &&
    visitedUser?.actions?.isBlockedByUser;

  const metaMessage = isMutuallyBlocked
    ? "You blocked each other"
    : visitedUser?.actions?.hasBlockedUser
      ? `You are blocked by @${visitedUser?.username}`
      : visitedUser?.actions?.isBlockedByUser
        ? `You blocked @${visitedUser?.username}`
        : null;
  const accessStatus = [UserAccountStatus.ACTIVE, UserAccountStatus.PRIVATE];
  const canAccess =
    (!isSuspended && !isBlocked) ||
    (!isBlocked && accessStatus.includes(visitedUser?.meta?.accountStatus));

  return (
    <React.Fragment>
      <PageHeader
        title={
          <Stack direction={"column"}>
            <Typography variant="subtitle1">{visitedUser?.name}</Typography>
            {!canView || isBlocked ? null : (
              <Typography variant="caption">{statCaption}</Typography>
            )}
          </Stack>
        }
      />
      <Paper sx={{ height: { lg: 200, md: 200, sm: 150, xs: 150 }, overflow: "hidden" }}>
        {canView && visitedUser.banner && <Box component="img" src={visitedUser.banner} alt="Profile banner" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </Paper>
      <Box sx={{ position: "relative", height: 50 }}>
        <Avatar
          sx={{
            height: { lg: 150, md: 150, sm: 120, xs: 100 },
            width: { lg: 150, md: 150, sm: 120, xs: 100 },
            position: "absolute",
            top: -50,
            left: 10,
          }}
          src={canView ? visitedUser.avatar! : undefined}
        />
        <Box
          sx={{
            position: {
              lg: "absolute",
              md: "absolute",
              sm: "absolute",
              xs: "absolute",
            },
            right: { lg: 10, md: 10, sm: 10, xs: 10 },
          }}
        >
          <Box sx={{ ml: { lg: 0, md: 0, sm: 0, xs: 10 } }}>
            <Stack
              direction={{ lg: "row", md: "row", sm: "row", xs: "row" }}
              sx={{
                alignItems: "center",
                gap: { lg: 1, md: 1, sm: 0.2, xs: 0.2 }
              }}>
              {(canAccess || isCurrentUser) && (
                <Tooltip title="Message">
                  <IconButton aria-label="Message"
                    LinkComponent={Link}
                    href={`/messages/${visitedUser?.id}/chat`}
                    disabled={isCurrentUser ? false : disabled}
                    size="small"
                  >
                    <MailOutlinedIcon />
                  </IconButton>
                </Tooltip>
              )}
              {!isCurrentUser && (canAccess || postNotifications?.subscribed) && (
                  <Tooltip title={notificationError ? 'Could not load preferences. Click to retry.' : notificationLabel}>
                    <IconButton disabled={((disabled || !followsAuthor) && !postNotifications?.subscribed) || notificationBusy || notificationLoading || !token}
                      size="small" aria-label={notificationLabel} aria-pressed={!!postNotifications?.subscribed}
                      color={postNotifications?.subscribed ? 'primary' : 'default'}
                      onClick={() => notificationError
                        ? void refreshPostNotifications().catch(error => notif.show(getErrorMessage(error), {severity: 'error', autoHideDuration: 5000}))
                        : void togglePostNotifications()}>
                      {postNotifications?.subscribed ? <NotificationsActiveOutlinedIcon /> : <NotificationAddOutlinedIcon />}
                    </IconButton>
                  </Tooltip>
              )}
              {canAccess && (
                <>
                  <Tooltip title={`Gift ${visitedUser?.username}`}>
                    <IconButton aria-label={`Gift ${visitedUser?.username}`} disabled={disabled} size="small">
                      <CardGiftcardOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              {(!isSuspended || isCurrentUser) && (
                <Tooltip title="See More Actions">
                  <IconButton
                    aria-label="Extra user options"
                    ref={anchorMenuRef}
                    id="composition-button"
                    aria-controls={openMenu ? "composition-menu" : undefined}
                    aria-expanded={openMenu ? "true" : undefined}
                    aria-haspopup="true"
                    onClick={(ev) => onToggleOptionsMenu()}
                    // disabled={disabled}
                    size="small"
                  >
                    <MoreHorizOutlinedIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            {(canAccess || isCurrentUser) && (
              <>
                <Stack
                  direction={"row"}
                  spacing={2}
                  sx={{
                    mt: isDeactivated || !isCurrentUser ? 2 : 0
                  }}
                >
                  {isDeactivated && (
                    <Box>
                      <Tooltip title={`Reactivate account`}>
                        <Button
                          disabled={state.loading}
                          loading={state.loading}
                          onClick={(ev) => {
                            ev.preventDefault();
                            onReactivateAccount(
                              isDeactivated
                                ? UserAccountStatus.ACTIVE
                                : UserAccountStatus.DEACTIVATED
                            );
                          }}
                          variant="outlined"
                          sx={{
                            borderRadius: 30,
                            fontSize: 10,
                            textTransform: "capitalize",
                          }}
                          size="small"
                          color={"info"}
                        >
                          Reactivate
                        </Button>
                      </Tooltip>
                    </Box>
                  )}
                  {!isCurrentUser && (
                    <Stack direction={"row"} spacing={2}>
                      {/* <Tooltip title={`Book ${visitedUser?.name}`}>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            borderRadius: 30,
                            fontSize: 10,
                            textTransform: "capitalize",
                          }}
                          color={"warning"}
                          LinkComponent={Link}
                          href={`/netwaves/${visitedUser?.username}`}
                        >
                          Book Me
                        </Button>
                      </Tooltip> */}
                      <Tooltip title={connBtn.btnText}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(ev) => {
                            ev.preventDefault();
                            if (showPopoverBtn) {
                              onToggleRequest(ev);
                            } else {
                              onFollowUser(getFollowAction());
                            }
                          }}
                          onMouseEnter={() => setBtnHover(true)}
                          onMouseLeave={() => setBtnHover(false)}
                          sx={{
                            borderRadius: 30,
                            fontSize: 10,
                            textTransform: "capitalize",
                          }}
                          color={connBtn.btnColor}
                        >
                          {connBtn.btnText}
                        </Button>
                      </Tooltip>
                    </Stack>
                  )}
                </Stack>
              </>
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={{ px: 2, mt: { lg: 6, md: 6, sm: 0, xs: 0 } }}>
        <Stack
          sx={{
            textDecoration: "none",
            // width: "max-content",
            // display: "inline-block",
            maxWidth: "100%",
            pb: 1,
          }}
          component={Link}
          href={`/@${visitedUser.username}`}
          spacing={-1}
          // gap={-3}
        >
          <Typography
            sx={{
              mt: {
                lg: 0,
                md: 0,
                sm: isDeactivated || !isCurrentUser ? 4 : 0,
                xs: isDeactivated || !isCurrentUser ? 4 : 0,
              },
              fontSize: { lg: "2.125rem", sm: "1.5rem", xs: "1.3rem" },
              textWrap: "wrap",
            }}
            variant="h4"
            color="textPrimary"
          >
            {visitedUser.name}
            {""}
            {visitedUser?.meta?.isPro && (
              <IconButton aria-label="Verified account" size="small">
                <VerifiedIcon
                  sx={{ width: 16, height: 16, color: badgeColor }}
                />
              </IconButton>
            )}
          </Typography>
          <Typography color="textDisabled" variant="caption">
            @{visitedUser.username}
          </Typography>
        </Stack>
        {!canView || isBlocked ? null : (
          <React.Fragment>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {visitedUser.bio}
            </Typography>
            <Stack
              direction={{ lg: "row", md: "row", sm: "row", xs: "column" }}
              sx={{
                gap: { lg: 2, md: 2, sm: 0.5, xs: 0.5 }
              }}
            >
              {visitedUser?.country && (
                <Stack
                  direction={{ lg: "row", md: "row", sm: "row", xs: "row" }}
                  sx={{
                    alignItems: "center",
                    gap: 1
                  }}>
                  <LocationOn sx={{ height: 15, width: 15 }} color="disabled" />
                  <Typography
                    color="textDisabled"
                    variant="caption"
                    sx={{ textDecoration: "none" }}
                  >
                    {visitedUser?.country?.emoji} {visitedUser?.country?.name}
                  </Typography>
                </Stack>
              )}

              {visitedUser.website && /^https?:\/\//i.test(visitedUser.website) && <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                <PublicOutlinedIcon sx={{ height: 15, width: 15 }} color="disabled" />
                <Typography component="a" href={visitedUser.website} target="_blank" rel="noopener noreferrer" variant="caption" color="primary" sx={{ overflowWrap: "anywhere" }}>
                  {visitedUser.website}
                </Typography>
              </Stack>}

              {isCurrentUser && dob && <Stack
                direction={{ lg: "row", md: "row", sm: "row", xs: "row" }}
                sx={{
                  alignItems: "center",
                  gap: 1
                }}>
                <CelebrationOutlinedIcon
                  sx={{ height: 15, width: 15 }}
                  color="disabled"
                />
                <Typography
                  color="textDisabled"
                  variant="caption"
                  sx={{ textDecoration: "none" }}
                >
                  Born{" "}
                  {isCurrentUser
                    ? `${dob.monthStr}-${dob.day}-${dob.year}`
                    : `${dob.monthStr} ${dob.day}`}
                </Typography>
              </Stack>}

              <Stack
                direction={{ lg: "row", md: "row", sm: "row", xs: "row" }}
                sx={{
                  alignItems: "center",
                  gap: 1
                }}>
                <CalendarMonthOutlined
                  sx={{ height: 15, width: 15 }}
                  color="disabled"
                />
                <Typography
                  color="textDisabled"
                  variant="caption"
                  sx={{ textDecoration: "none" }}
                >
                  Joined {formatDateTime(visitedUser?.createdAt, "long")}
                </Typography>
              </Stack>
            </Stack>
            <Stack
              direction={"row"}
              sx={{
                mt: 0.2,
                gap: 2
              }}>
              <Typography
                color="textSecondary"
                variant="caption"
                sx={{ textDecoration: "none" }}
                component={Link}
                href={`/${visitedUser.username}/network/followers`}
              >
                {formatNumber(visitedUser.conn.followerCount)} Followers
              </Typography>

              <Typography
                color="textSecondary"
                variant="caption"
                sx={{ textDecoration: "none" }}
                component={Link}
                href={`/${visitedUser.username}/network/following`}
              >
                {formatNumber(visitedUser.conn.followingCount)} Following
              </Typography>
            </Stack>
            {!isCurrentUser && (
              <Stack
                direction={"row"}
                spacing={1}
                sx={{ py: 1, alignItems: "center" }}
              >
                <AvatarGroup spacing="medium">
                  {visitedUser?.mutualFollowers?.map((conn) => (
                    <Avatar
                      sx={{ height: 24, width: 24 }}
                      alt={conn?.name}
                      src={conn?.avatar!}
                      key={conn?.id}
                    />
                  ))}
                </AvatarGroup>
                <Box>
                  <Typography
                    sx={{
                      lineHeight: 1,
                      display: "block",
                      whiteSpace: "pre-line",
                    }}
                    color="textDisabled"
                    variant="caption"
                  >
                    {composeMutualText({
                      followers: visitedUser?.mutualFollowers,
                      total: visitedUser.conn.mutualCount,
                    })}
                  </Typography>
                </Box>
              </Stack>
            )}
          </React.Fragment>
        )}
        <Box
          sx={{
            mt: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {(!canAccess || !canView) && (
            <>
              <Stack
                direction={{
                  lg: "row",
                  md: "row",
                  sm: "column",
                  xs: "column",
                }}
                sx={{
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                <IconButton aria-label="Private account" disabled={true} size="large">
                  {isPrivate ? <Lock /> : <WarningOutlined />}
                </IconButton>
                <Typography
                  sx={{ p: 1, textAlign: "center", fontFamily: "PlayFair" }}
                  variant="h5"
                >
                  {metaMessage ? metaMessage : visitedUser?.meta?.message}
                </Typography>
              </Stack>
              {visitedUser?.actions?.isBlockedByUser && (
                <Box>
                  <Tooltip title={`Take action`}>
                    <Button
                      disabled={state.loading}
                      loading={state.loading}
                      onClick={(ev) => {
                        ev.preventDefault();
                        onUnblockAccount();
                      }}
                      variant="outlined"
                      sx={{
                        borderRadius: 30,
                        // fontSize: 10,
                        textTransform: "capitalize",
                      }}
                      size="medium"
                      color="warning"
                    >
                      {visitedUser?.actions?.isBlockedByUser
                        ? "Unblock"
                        : "Block"}
                    </Button>
                  </Tooltip>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
      <RequestPopover
        open={open}
        anchorEl={anchorEl}
        onClose={onClosePopover}
        onAction={onFollowUser}
      />
      {/* profile options */}
      <ProfileOptions
        visitedUser={state.visitedUser}
        handleClose={onCloseOptionsMenu}
        handleListKeyDown={handleListKeyDown}
        open={openMenu}
        anchorRef={anchorMenuRef}
        onActionsUpdate={onActionsUpdate}
        onMetaUpdate={onMetaUpdate}
      />
    </React.Fragment>
  );
};

export default ProfileClient;
