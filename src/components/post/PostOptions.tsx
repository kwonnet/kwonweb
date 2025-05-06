"use client";
import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import {
  ClickAwayListener,
  Grow,
  ListItemIcon,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Tooltip,
} from "@mui/material";
import { FeedPost, PostAuthor, PostKind, PostPinContext } from "@/types";
import { useAuthSession } from "@/hooks";
import SentimentDissatisfiedOutlinedIcon from "@mui/icons-material/SentimentDissatisfiedOutlined";
import PersonRemoveAlt1OutlinedIcon from "@mui/icons-material/PersonRemoveAlt1Outlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import DoNotDisturbOnTotalSilenceOutlinedIcon from "@mui/icons-material/DoNotDisturbOnTotalSilenceOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import OutlinedFlagOutlinedIcon from "@mui/icons-material/OutlinedFlagOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import RedeemOutlinedIcon from "@mui/icons-material/RedeemOutlined";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import BookmarkRemoveOutlinedIcon from "@mui/icons-material/BookmarkRemoveOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import ReportOutlinedIcon from "@mui/icons-material/ReportOutlined";
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { getConnBtnText } from "@/utils/post";
import { getPostUrl, shortenText } from "@/utils";
import { useNotifications } from "@toolpad/core";
import { useRouter } from "next/navigation";
import { deletePost, hideReply, highlightPost, pinPost, updateNotInterestedPost } from "@/lib/posts";
import { blockUser, muteUser } from "@/lib/users";
import PostReportModal from "./PostReportModal";

const PostOptions = ({
  item,
  open,
  anchorRef,
  handleClose,
  handleListKeyDown,
  handleBookmark,
  handleFollowUser,
}: {
  item: FeedPost;
  open: boolean;
  handleClose: (event: Event | React.SyntheticEvent) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  handleListKeyDown: (event: React.KeyboardEvent) => void;
  handleBookmark: (ev: any, id: string, saved: boolean) => void;
  handleFollowUser: (recipientId: string, isFollow: boolean) => void;
}) => {
  const { user, token } = useAuthSession();

  const isCurrentUser = user.id === item.author?.id;

  const canHideReply = item.kind === PostKind.REPLY ? item.actions.canHideReply : false 

  const isFriends = item.author.conn.isFollowing && item.author.conn.isFollowed;

  const [state, setState] = useState({ open: false, isPostReport: false });

  const notif = useNotifications();

  const router = useRouter();

  const getConnIcon = () => {
    return isFriends || item.author.conn.isFollowed ? (
      <PersonRemoveAlt1OutlinedIcon fontSize="small" />
    ) : item.author.conn.isFollowed ? (
      <PersonOutlinedIcon />
    ) : item.author.conn.isFollowing ? (
      <PersonAddAlt1OutlinedIcon />
    ) : (
      <PersonAddAlt1OutlinedIcon />
    );
  };

  const toggle = (open: boolean) => {
    setState((prev) => ({ ...prev, open }));
  };

  const handleReportToggle = (
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>,
    isPostReport: boolean
  ) => {
    setState((prev) => ({ ...prev, isPostReport, open: true }));
    handleClose(ev);
  };

  const handleLinkCopy = (ev: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    const url = getPostUrl(item.id, item.author.username);
    navigator.clipboard.writeText(url);
    notif.show("Link copied", {
      severity: "info",
      autoHideDuration: 2000,
    });
    handleClose(ev);
  };

  const handleViewEngagement = (
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    handleClose(ev);
    router.push(`/${item.author.username}/feed/${item.id}/quotes`);
  };

  const handleAnalytics = (
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    handleClose(ev);
    router.push(`/${item.author.username}/feed/${item.id}/analytics`);
  };

  const handleSave = (ev: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    handleBookmark(ev, item.id, !item.actions.hasSaved);
    notif.show(item.actions.hasSaved ? "Bookmark removed" : "Bookmark saved", {
      severity: item.actions.hasSaved ? "warning" : "info",
      autoHideDuration: 2000,
    });
    handleClose(ev);
  };

  const handleFollow = (ev: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    const isFollowed = item.author.conn.isFollowed;
    handleFollowUser(item.author.id, !isFollowed);
    notif.show(
      isFollowed
        ? `${item.author.name} unfollowed`
        : `${item.author.name} followed`,
      {
        severity: isFollowed ? "warning" : "info",
        autoHideDuration: 2000,
      }
    );
    handleClose(ev);
  };

  const handleNotInterested = (
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    updateNotInterestedPost(item.id, token);
    handleClose(ev);
  };

  const handleBlockUser = (ev: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    blockUser(item.author.id, token);
    handleClose(ev);
  };

  const handleMuteUser = (ev: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    muteUser(item.author.id, token);
    handleClose(ev);
  };

  const handleDeletePost = async(
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>
    ) => {
      ev.preventDefault();
      ev.stopPropagation();
      handleClose(ev);
      const result = await deletePost(item.id, token);
      const isError = !result.data;
      notif.show(result.message, {
        severity: isError ? "error" : "success",
        autoHideDuration: 3000,
      });
    };

    const handleHideReply = async(
      ev: React.MouseEvent<HTMLLIElement, MouseEvent>
      ) => {
        ev.preventDefault();
        ev.stopPropagation();
        handleClose(ev);
        const result = await hideReply(item.id, token);
        const isError = !result.data;
        notif.show(result.message, {
          severity: isError ? "error" : "success",
          autoHideDuration: 3000,
        });
      };

  const handlePinPost = async (
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    try {
      const result = await pinPost(
        { id: item.id, context: PostPinContext.PROFILE },
        token
      );
      const isError = !result.data;
      notif.show(result.message, {
        severity: isError ? "error" : "success",
        autoHideDuration: 3000,
      });
      handleClose(ev);
    } catch (error) {}
  };

  const handleHighlightPost = async (
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    try {
      const result = await highlightPost(
        { id: item.id, context: PostPinContext.PROFILE },
        token
      );
      const isError = !result.data;
      notif.show(result.message, {
        severity: isError ? "error" : "success",
        autoHideDuration: 3000,
      });
      handleClose(ev);
    } catch (error) {}
  };

  

  return (
    <Box>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement="bottom-start"
        transition
        disablePortal
        sx={{ zIndex: 999999999, maxHeight: 200, overflow: "auto" }}
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom-start" ? "left top" : "left bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={open}
                  id="composition-menu"
                  aria-labelledby="composition-button"
                  onKeyDown={handleListKeyDown}
                >
                  {isCurrentUser && (
                    <Box>
                      <MenuItem onClick={(ev) => handlePinPost(ev)}>
                        <ListItemIcon>
                          <PushPinOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        Pin Post
                      </MenuItem>
                      <MenuItem onClick={ev => handleHighlightPost(ev)}>
                        <ListItemIcon>
                          <InsightsOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        Highlight Post
                      </MenuItem>

                      <MenuItem onClick={ev => handleAnalytics(ev)}>
                        <ListItemIcon>
                          <BarChartOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        View Analytics
                      </MenuItem>
                    </Box>
                  )}
                  {!isCurrentUser && (
                    <Box>
                      <MenuItem onClick={(ev) => handleNotInterested(ev)}>
                        <ListItemIcon>
                          <SentimentDissatisfiedOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        Not interested in this post
                      </MenuItem>
                      <MenuItem onClick={(ev) => handleFollow(ev)}>
                        <ListItemIcon>{getConnIcon()}</ListItemIcon>
                        {getConnBtnText(item.author, true)} @
                        {shortenText(item.author.username, 12)}
                      </MenuItem>

                      <MenuItem onClick={handleClose}>
                        <ListItemIcon>
                          <RedeemOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        Gift @{shortenText(item.author.username, 12)}
                      </MenuItem>

                      <MenuItem onClick={(ev) => handleMuteUser(ev)}>
                        <ListItemIcon>
                          <DoNotDisturbOnTotalSilenceOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        Mute @{shortenText(item.author.username, 12)}
                      </MenuItem>

                      <MenuItem onClick={(ev) => handleBlockUser(ev)}>
                        <ListItemIcon>
                          <BlockOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        Block @{shortenText(item.author.username, 12)}
                      </MenuItem>
                      <MenuItem
                        onClick={(ev) => {
                          ev.preventDefault();
                          handleReportToggle(ev, false);
                        }}
                      >
                        <ListItemIcon>
                          <ReportOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        Report @{shortenText(item.author.username, 12)}
                      </MenuItem>
                    </Box>
                  )}

                  <MenuItem onClick={(ev) => handleViewEngagement(ev)}>
                    <ListItemIcon>
                      <AutoGraphRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    View Engagement
                  </MenuItem>

                  <MenuItem onClick={(ev) => handleLinkCopy(ev)}>
                    <ListItemIcon>
                      <LinkOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    Copy link
                  </MenuItem>

                  <MenuItem onClick={(ev) => handleSave(ev)}>
                    <ListItemIcon>
                      {item.actions.hasSaved ? (
                        <BookmarkRemoveOutlinedIcon
                          color="primary"
                          fontSize="small"
                        />
                      ) : (
                        <BookmarkAddOutlinedIcon fontSize="small" />
                      )}
                    </ListItemIcon>
                    {item.actions.hasSaved ? "Unsave post" : "Save post"}
                  </MenuItem>

                  {/*
                  </MenuItem>

                  {/* <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                      <CodeOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    Embed post
                  </MenuItem> */}

                  {!isCurrentUser && (
                    <MenuItem
                      onClick={(ev) => {
                        ev.preventDefault();
                        handleReportToggle(ev, true);
                      }}
                    >
                      <ListItemIcon>
                        <OutlinedFlagOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      Report post
                    </MenuItem>
                  )}
                  {
                    canHideReply && <MenuItem onClick={ev => handleHideReply(ev)}>
                    <ListItemIcon>
                      <Tooltip title="Hidden replies">
                       {item.isHidden ? <VisibilityOutlinedIcon fontSize="small" /> : <VisibilityOffOutlinedIcon fontSize="small" />}
                      </Tooltip>
                    </ListItemIcon>
                    {item.isHidden ? "Unhide Reply" : "Hide Reply"}
                  </MenuItem>
                  }
                  {isCurrentUser && (
                    <MenuItem onClick={ev => handleDeletePost(ev)}>
                      <ListItemIcon>
                        <DeleteForeverOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      Delete {item.kind === PostKind.REPLY ? "Reply" : "Post"}
                    </MenuItem>
                  )}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
      <PostReportModal
        isPostReport={state.isPostReport}
        post={item}
        open={state.open}
        toggle={toggle}
      />
    </Box>
  );
};

export default PostOptions;
