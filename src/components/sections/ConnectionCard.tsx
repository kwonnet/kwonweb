"use client";
import { useAuthSession, useBadgeColor } from "@/hooks";
import { FollowAction, FollowStatus, UserConnection } from "@/types/user";
import {
  getConnBtnInfo,
  getFollowAction,
  getUserConnInfo,
} from "@/utils/connections";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import RequestPopover from "@/components/common/RequestPopover";
import VerifiedIcon from "@mui/icons-material/Verified";
import Link from "next/link";
import { formatNumber, shortenText } from "@/utils";

const ConnectionCard = ({
  item,
  onFollowUser,
  raised,
  mini = true,
}: {
  item: UserConnection;
  onFollowUser: (connUser: UserConnection, action: FollowAction) => void;
  raised?: boolean
  mini?: boolean
}) => {
  const { user } = useAuthSession()

  const [btnHover, setBtnHover] = useState(false);

  const badgeColor = useBadgeColor(item?.meta?.color);

  const isCurrentUser = item.id === user?.id

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
  const display =  (
    <React.Fragment>
      <Stack
        direction={"row"}
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          maxWidth: "100%"
        }}>
        <Stack
          direction={"row"}
          spacing={0.5}
          sx={{ textDecoration: "none" }}
          component={Link}
          href={`/@${item.username}`}
        >
          <Avatar src={item.avatar!} alt={item.name}>
            {item?.name[0]}
          </Avatar>
          <Stack direction={"column"} sx={{ maxWidth: "100%" }}>
            <Typography
              sx={{
                textDecoration: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              color="textPrimary"
              variant="body2"
            >
              {item.name}
              {item?.meta?.isPro && (
                <IconButton aria-label="Verified account" size="small">
                  <VerifiedIcon
                    sx={{ width: 12, height: 12, color: badgeColor }}
                  />
                </IconButton>
              )}
            </Typography>

            <Typography
              sx={{
                textDecoration: "none",
                // whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              color="textDisabled"
              variant="caption"
            >
              @{item.username}
            </Typography>
          </Stack>
        </Stack>
        {!isCurrentUser && <Button
          sx={{ borderRadius: 30 }}
          variant="outlined"
          size="small"
          color={connBtn.btnColor}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
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
        >
          {connBtn.btnText}
        </Button>}
      </Stack>
      {!mini && (<Box sx={{ px: 2, py: 1 }}>
        <Typography color="textDisabled" component={"p"} variant="caption">
          {shortenText(
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Deleniti ratione alias eveniet corporis rem saepe consectetur hic ipsam ea cum! Blanditiis deserunt totam including lead management, analytics",
            60
          )}{" "}
        </Typography>
        <Box sx={{ pt: 0.5 }}>
        <Stack direction={"row"} sx={{
          gap: 2
        }}>
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
      </Box>)}
      <RequestPopover
        open={open}
        anchorEl={anchorEl}
        onClose={onClosePopover}
        onAction={handleAction}
      />
    </React.Fragment>
  );

  if(raised){
    return <Paper sx={{p: 1}}>{display}</Paper>
  }
  return display
};

export default ConnectionCard;
