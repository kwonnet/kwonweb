"use client";
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { composeMutualText, formatNumber, getSessionId, shortenText } from "@/utils";
import { PostAuthor } from "@/types";
import { useAuthSession, useBadgeColor } from "@/hooks";
import { useRef } from "react";
import VerifiedIcon from "@mui/icons-material/Verified";
import useSWR, { useSWRConfig } from "swr";
import { getUserOverview } from "@/lib/users";
import { FollowAction, FollowStatus, UserMiniProfile } from "@/types/user";
import Link from "next/link";
import { getConnBtnInfo, getFollowAction, getUserConnInfo } from "@/utils/connections";

const AuthorHoverPreview = ({
  author,
  isName,
  onFollowUserCallback,
}: {
  author: PostAuthor;
  isName?: boolean;
  onFollowUserCallback: (
    args: {
      senderId: string;
      recipientId: string;
      action: FollowAction
    }
  ) => void;
}) => {
  const { user, token } = useAuthSession();
  const [showInfo, setShowInfo] = useState(false);
  const swrKey = `${user?.id}_${author.id}_overview`;
  const { data } = useSWR(showInfo && token ? swrKey : null, () => getUserOverview(author.id, token));

  const { mutate } = useSWRConfig();



  const [btnHover, setBtnHover] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>
  ) => {
    if (!token) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 316)),
    });
    timerRef.current = setTimeout(() => setShowInfo(true), 500);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowInfo(false), 200);
  };

  const handleFollow = (recipientId: string, action: FollowAction) => {
    const postiveStatus = [FollowAction.ACCEPT, FollowAction.FOLLOW]
    const isFollow = postiveStatus.includes(action) 
    // setFollowed(true);
    // Call follow API or logic here
    const updateConnData = (d?: UserMiniProfile) => {
      if (!d) return d;
      return {
        ...d,
        conn: {
          ...d.conn,
          followerCount: isFollow ? d.conn.followerCount + 1 : d.conn.followerCount - 1,
        }
      };
    };
    mutate(
      (key) => typeof key === "string" && key.startsWith(swrKey),
      (d: UserMiniProfile | undefined) => updateConnData(d),
      {
        optimisticData: (data?: any) =>
          data ? updateConnData(data) : undefined,
        populateCache: true,
        rollbackOnError: true,
        revalidate: false,
      }
    );
    onFollowUserCallback({ senderId: user?.id, recipientId, action });
  };

  // const composeText = ({ followers, total}: {followers?: MutualFollower[], total: number}) => {
  //   if(followers?.length === 0) return ""
  //   const msg = followers?.map((conn) => conn?.name).join(", ")
  //   const count = followers?.length || 0
  //   if (total > count) {
  //     return `Followed by ${msg} and ${total - count} that you also follow`;
  //   }
  //   return `Followed by ${msg} that you also follow`;
  // };

  // check if it's the current reader
  const isCurrentUser = user?.id === author?.id;

  const badgeColor = useBadgeColor(author?.meta?.color)

  const isProUser = author?.meta?.isPro
  
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

    const handleAction = (action: FollowAction) => {
        // onFollowUser(item, action);
        handleFollow(author.id, action)
      };



    const { isFriends } = getUserConnInfo(author?.conn);
  
    const connBtn = getConnBtnInfo(author?.conn, btnHover);
  
    const showPopoverBtn = author?.conn?.followingStatus === FollowStatus.PENDING;


  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        display: "inline",
        position: "relative"
      }}>
      {isName ? (
        <Link
          style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center", minHeight: 24, minWidth: 24 }}
          href={`/@${author?.username}`}
        >
          <Stack direction={"row"} sx={{ alignItems: "center" }}>
            <Typography sx={{ fontWeight: "bold" }} variant="subtitle1">
              {author?.name}
            </Typography>
            {isProUser &&
            <Box component="span" role="img" aria-label="Verified account" sx={{ display: "inline-flex", p: 0.5 }}>
              <VerifiedIcon sx={{ width: 16, height: 16, color: badgeColor }} />
            </Box>
          }
          </Stack>
        </Link>
      ) : (
        <Link
          style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center", minHeight: 24, minWidth: 24 }}
          href={`/@${author?.username}`}
        >
          <Typography
            sx={{ display: "block" }}
            color="text.secondary"
            variant="caption"
          >
            @{author?.username}
          </Typography>
        </Link>
      )}

      {showInfo && data && (
        <Box
          sx={{
            position: "fixed",
            top: position.top,
            left: position.left,
            zIndex: 9999999999,

            // transform: showInfo ? 'translateY(0)' : 'translateY(-30px)',
            transition: "opacity 0.3s ease, transform 0.3s ease"
          }}>
          <Paper
            elevation={4}
            sx={{
              py: 1,
              px: 2,
              width: 300,
              cursor: "auto",
              "&:hover": {
                boxShadow: 6,
              },
            }}
          >
            <Stack direction={"row"} sx={{ justifyContent: "space-between" }}>
              <Box>
                <Badge slotProps={{ badge: { "aria-hidden": false } }}
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    isProUser && <IconButton aria-label="Verified account"
                    size="small"
                  >
                    <VerifiedIcon
                      sx={{ width: 16, height: 16, color: badgeColor }}
                    />
                  </IconButton>
                  }
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <Link aria-label={`View ${author?.name || 'user'} profile`} href={`/@${author?.username}`}>
                    <Avatar
                      sx={{
                        height: 45,
                        width: 45,
                        border: (theme) =>
                          `4px solid ${theme.vars.palette.background.paper}`,
                      }}
                      alt={author?.name}
                      src={author?.avatar}
                    />
                  </Link>
                </Badge>
              </Box>

              {isCurrentUser ? null : (
                <Button
                  sx={{ borderRadius: 10, height: 32 }}
                  variant="outlined"
                  size="small"
                  onMouseEnter={() => setBtnHover(true)}
                  onMouseLeave={() => setBtnHover(false)}
                  color={connBtn.btnColor}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    if (showPopoverBtn) {
                      onToggleRequest(ev);
                    } else {
                      handleAction(
                        getFollowAction(isFriends, data?.conn?.followedStatus)
                      );
                    }
                  }}
                >
                  {connBtn.btnText}
                </Button>
              )}
            </Stack>
            <Stack spacing={-1}>
              <Typography variant="subtitle1" sx={{
                fontWeight: "bold"
              }}>
                {author?.name}
              </Typography>
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{
                  fontWeight: "bold"
                }}
              >
                @{author?.username}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {shortenText(
                "AI in storytelling is still evolving. It challenges us to rethink what it means to be a creator. Can a machine be an author? Should AI-generated stories be labeled? As tools get better, the lines blur between human Can a machine be an author? Should AI-generated",
                200
              )}
            </Typography>
            {data && (
              <Box sx={{ pt: 1 }}>
                <Stack
                  sx={{ justifyContent: "space-between" }}
                  direction={"row"}
                  spacing={1}
                >
                  <Stack
                    direction={"row"}
                    sx={{ alignItems: "center" }}
                    spacing={1}
                  >
                    <Typography variant="caption">
                      {formatNumber(data.conn.followerCount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Followers
                    </Typography>
                  </Stack>
                  <Stack
                    direction={"row"}
                    sx={{ alignItems: "center" }}
                    spacing={1}
                  >
                    <Typography variant="caption">
                      {formatNumber(data.conn.followingCount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Following
                    </Typography>
                  </Stack>
                  
                </Stack>
                {data && data.id !== user?.id && (
                  <Stack direction={"row"} spacing={1} sx={{ py: 1 }}>
                    <AvatarGroup spacing="medium">
                      {data?.mutualFollowers?.map((conn) => (
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
                        color="text.secondary"
                        variant="caption"
                      >
                        {composeMutualText(
                          {followers: data?.mutualFollowers,
                            total: data.conn.mutualCount}
                        )}
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </Box>
            )}
          </Paper>
        </Box>
      )}

    </Box>
  );
};

export default AuthorHoverPreview