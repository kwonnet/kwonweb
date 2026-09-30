"use client";
import { FollowAction, FollowStatus, UserConnection } from "@/types/user";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  CardMedia,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

import Stack from "@mui/material/Stack";
import { formatNumber, shortenText } from "@/utils";
import Link from "next/link";
import {
  composeMutualText,
  getConnBtnInfo,
  getFollowAction,
  getUserConnInfo,
} from "@/utils/connections";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useBadgeColor } from "@/hooks";
import { RequestPopover } from "@/components/common";

const ConnectionCard = ({
  item,
  onFollowUser,
}: {
  item: UserConnection;
  onFollowUser: (connUser: UserConnection, action: FollowAction) => void
}) => {
  const [btnHover, setBtnHover] = useState(false);

  const badgeColor = useBadgeColor(item?.meta?.color);

  const { isFriends } = getUserConnInfo(item.conn);

  const connBtn = getConnBtnInfo(item.conn, btnHover);

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

  const showPopoverBtn = item?.conn?.followingStatus === FollowStatus.PENDING;

  const handleAction = (action: FollowAction) => {
    onFollowUser(item, action);
  };

  return (
    <Box sx={{ px: 1, py: 1, height: "100%" }}>
      <Paper sx={{ pb: 2, height: "100%" }}>
        <Link href={`/@${item?.username}`}>
          <CardMedia
            image={item.avatar ?? "/avatar.jpeg"}
            component={"img"}
            sx={{
              height: 200,
              borderTopRightRadius: 5,
              borderTopLeftRadius: 5,
              objectFit: "cover",
              objectPosition: "50% 50%",
            }}
          />
        </Link>
        <Box sx={{ px: 2, py: 1 }}>
          <Stack
            sx={{ textDecoration: "none" }}
            component={Link}
            href={`/@${item.username}`}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <Typography
                sx={{
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                color="textPrimary"
                variant="subtitle1"
              >
                {item.name}
              </Typography>
              {item?.meta?.isPro && (
                <IconButton size="small" sx={{ ml: 0.1, flexShrink: 0 }}>
                  <VerifiedIcon
                    sx={{ width: 14, height: 14, color: badgeColor }}
                  />
                </IconButton>
              )}
            </Box>
            <Typography
              sx={{
                textDecoration: "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              color="textDisabled"
              variant="caption"
            >
              @{item.username}
            </Typography>
          </Stack>
          <Typography color="textDisabled" component={"p"} variant="caption">
            {shortenText(
              "Lorem ipsum dolor sit amet consectetur adipisicing elit. Deleniti ratione alias eveniet corporis rem saepe consectetur hic ipsam ea cum! Blanditiis deserunt totam",
              60
            )}{" "}
          </Typography>
          <Box sx={{ pt: 0.5 }}>
            <Stack direction={"row"} gap={2}>
              <Typography
                color="textSecondary"
                variant="caption"
                sx={{ textDecoration: "none" }}
                component={Link}
                href={`/${item.username}/network/followers`}
              >
                {formatNumber(item.conn.followerCount)} Followers
              </Typography>

              <Typography
                color="textSecondary"
                variant="caption"
                sx={{ textDecoration: "none" }}
                component={Link}
                href={`/${item.username}/network/following`}
              >
                {formatNumber(item.conn.followingCount)} Following
              </Typography>
            </Stack>
          </Box>
          <Stack
            direction={"row"}
            spacing={1}
            sx={{ py: 1, alignItems: "center" }}
          >
            <AvatarGroup spacing="medium">
              {item?.mutualFollowers?.map((conn) => (
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
                  followers: item?.mutualFollowers as UserConnection[],
                  total: item.conn.mutualCount,
                })}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Box sx={{ display: "block", textAlign: "center" }}>
          <Button
            variant="outlined"
            size="small"
            onClick={(ev) => {
              ev.preventDefault();
              if (showPopoverBtn) {
                onToggleRequest(ev);
              } else {
                handleAction(
                  getFollowAction(isFriends, item?.conn?.followedStatus)
                );
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
        </Box>
      </Paper>
      <RequestPopover
        open={open}
        anchorEl={anchorEl}
        onClose={onClosePopover}
        onAction={handleAction}
      />
    </Box>
  );
};

export default ConnectionCard;
