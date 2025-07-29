"use client";
import React, { useState } from "react";
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
import { formatNumber, getSessionId, shortenText } from "@/utils";
import { PostAuthor } from "@/types";
import { useAuthSession, useBadgeColor } from "@/hooks";
import { useRef } from "react";
import VerifiedIcon from "@mui/icons-material/Verified";
import useSWR, { useSWRConfig } from "swr";
import { getUserOverview } from "@/lib/users";
import { UserFollower, UserMiniProfile } from "@/types/user";
import { getConnBtnColor, getConnBtnText } from "@/utils/post";
import Link from "next/link";

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
    },
    isFollow: boolean
  ) => void;
}) => {
  const { user, token } = useAuthSession();
  const swrKey = `${author.id}_overview`;
  const { data } = useSWR(swrKey, () => getUserOverview(author.id, token));

  const { mutate } = useSWRConfig();

  const [showInfo, setShowInfo] = useState(false);

  const [btnHover, setBtnHover] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>
  ) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });
    timerRef.current = setTimeout(() => setShowInfo(true), 500);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowInfo(false), 200);
  };

  const handleFollow = (recipientId: string) => {
    const isFollow = !author.conn.isFollowed
    // setFollowed(true);
    // Call follow API or logic here
    const updateConnData = (d?: UserMiniProfile) => {
      if (!d) return d;
      return {
        ...d,
        followerCount: isFollow ? d.followerCount + 1 : d.followerCount - 1,
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
    onFollowUserCallback({ senderId: user.id, recipientId }, isFollow);
  };

  const composeText = ({ followers, total}: {followers?: UserFollower[], total: number}) => {
    if(followers?.length === 0) return ""
    const msg = followers?.map((conn) => conn?.name).join(", ")
    const count = followers?.length || 0
    if (total > count) {
      return `Followed by ${msg} and ${total - count} that you also follow`;
    }
    return `Followed by ${msg} that you also follow`;
  };

  // check if it's the current reader
  const isCurrentUser = user.id === author?.id;
  //   check if both follow each other

  // const currUserBadgeColor = useBadgeColor(user?.meta?.color)

  const badgeColor = useBadgeColor(author?.meta?.color)

  const isProUser = author?.meta?.isPro


  return (
    <Box
      display="inline"
      position="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isName ? (
        <Link
          style={{ textDecoration: "none", color: "inherit" }}
          href={`/@${author?.username}`}
        >
          <Stack direction={"row"} sx={{ alignItems: "center" }}>
            <Typography sx={{ fontWeight: "bold" }} variant="subtitle1">
              {author?.name}
            </Typography>
            {isProUser &&
            <IconButton
              disableFocusRipple
              disableRipple
              disableTouchRipple
              size="small"
            >
              <VerifiedIcon sx={{ width: 16, height: 16, color: badgeColor }} />
            </IconButton>
          }
          </Stack>
        </Link>
      ) : (
        <Link
          style={{ textDecoration: "none", color: "inherit" }}
          href={`/@${author?.username}`}
        >
          <Typography
            sx={{ display: "block" }}
            color="textDisabled"
            variant="caption"
          >
            @{author?.username}
          </Typography>
        </Link>
      )}

      {showInfo && (
        <Box
          position="fixed"
          sx={{
            top: position.top,
            left: position.left,
            zIndex: 9999999999,
            transition: "opacity 0.3s ease, transform 0.3s ease",
            // transform: showInfo ? 'translateY(0)' : 'translateY(-30px)',
          }}
        >
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
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    isProUser && <IconButton
                    size="small"
                  >
                    <VerifiedIcon
                      sx={{ width: 16, height: 16, color: badgeColor }}
                    />
                  </IconButton>
                  }
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <Link href={`/@${author?.username}`}>
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
                  color={
                    getConnBtnColor(author, btnHover)
                  }
                  onClick={(ev) => {
                    ev.stopPropagation();
                    handleFollow(author.id);
                  }}
                >
                  {getConnBtnText(author, btnHover)}
                </Button>
              )}
            </Stack>
            <Stack spacing={-1}>
              <Typography variant="subtitle1" fontWeight="bold">
                {author?.name}
              </Typography>
              <Typography
                color="textDisabled"
                variant="caption"
                fontWeight="bold"
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
                      {formatNumber(data.followingCount)}
                    </Typography>
                    <Typography variant="caption" color="textDisabled">
                      Following
                    </Typography>
                  </Stack>
                  <Stack
                    direction={"row"}
                    sx={{ alignItems: "center" }}
                    spacing={1}
                  >
                    <Typography variant="caption">
                      {formatNumber(data.followerCount)}
                    </Typography>
                    <Typography variant="caption" color="textDisabled">
                      Followers
                    </Typography>
                  </Stack>
                </Stack>
                {data && data.id !== user.id && (
                  <Stack direction={"row"} spacing={1} sx={{ py: 1 }}>
                    <AvatarGroup spacing="medium">
                      {data?.followers?.map((conn) => (
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
                        {composeText(
                          {followers: data?.followers,
                            total: data.mutualCount}
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