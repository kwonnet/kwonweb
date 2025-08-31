"use client";
import { useAuthSession, useBadgeColor } from "@/hooks";
import { formatNumber, shortenText } from "@/utils";
import {
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import React, { useState } from "react";
import VerifiedIcon from "@mui/icons-material/Verified";
import { FollowAction, FollowStatus, UserConnection } from "@/types/user";
import {
  getConnBtnInfo,
  getFollowAction,
  getUserConnInfo,
} from "@/utils/connections";
import { RequestPopover } from "@/components/common";

const BlockMuteCard = ({
  item,
  onFollowUser,
}: {
  item: UserConnection;
  onFollowUser: (userItem: UserConnection, action: FollowAction) => void;
}) => {
  const [btnHover, setBtnHover] = useState(false);

  const { user } = useAuthSession();

  const isCurrentUser = user.id === item.id;

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
        onFollowUser(item, action );
    }


  return (
    <React.Fragment>
      
    <Paper sx={{ pb: 2, height: "100%" }}>
      <Stack direction={"row"} alignItems={"center"}>
        <Box>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={
              item.meta.isPro && (
                <IconButton size="small">
                  <VerifiedIcon
                    sx={{ width: 16, height: 16, color: badgeColor }}
                  />
                </IconButton>
              )
            }
            onClick={(ev) => ev.stopPropagation()}
          >
            <Link style={{textDecoration: "none"}} href={`/@${item?.username}`}>
              <Avatar
                sx={{
                  height: 60,
                  width: 60,
                  
                  border: (theme) =>
                    `4px solid ${theme.vars.palette.background.paper}`,
                }}
                alt={item?.name}
                src={item?.avatar!}
              >{item?.name[0]}</Avatar>
            </Link>
          </Badge>
        </Box>
        <Stack
          direction={"row"}
          sx={{ justifyContent: "space-between", width: "100%" }}
        >
          <Stack
            spacing={-1}
            sx={{ textDecoration: "none" }}
            component={Link}
            href={`/@${item.username}`}
          >
            <Typography
              variant="subtitle1"
              sx={{ textDecoration: "none" }}
              color="textPrimary"
            >
              {shortenText(item.name, 15)}
            </Typography>
            <Stack spacing={-1}>
            <Typography
              sx={{ textWrap: "wrap" }}
              color="textDisabled"
              variant="caption"
            >
              @{shortenText(item.username, 15)}
            </Typography>
            </Stack>
          </Stack>
          
          {!isCurrentUser && (
            <Box sx={{ p: 2 }}>
              <Button
                onClick={(ev) => {
                  ev.preventDefault();
                  if(showPopoverBtn){
                    onToggleRequest(ev)
                  }else{
                    handleAction(getFollowAction(isFriends, item?.conn?.followedStatus))
                  }
                }}
                variant="outlined"
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                sx={{
                  borderRadius: 30,
                  fontSize: 10,
                  textTransform: "capitalize",
                }}
                size="small"
                color={connBtn.btnColor}
              >
                {connBtn.btnText}
              </Button>
            </Box>
          )}
        </Stack>
      </Stack>
      <Box sx={{ px: 2, py: 1 }}>
        <Typography color="textDisabled" component={"p"} variant="subtitle2">
          {shortenText(item.bio, 60)}{" "}
        </Typography>

        <Box sx={{ pt: 0.5 }}>
          <Stack direction={"row"} gap={2}>
            <Typography
              color="textDisabled"
              variant="caption"
              sx={{ textDecoration: "none" }}
              component={Link}
              href={`/${item.username}/network/followers`}
            >
              {formatNumber(item.conn.followerCount)} Followers
            </Typography>

            <Typography
              color="textDisabled"
              variant="caption"
              sx={{ textDecoration: "none" }}
              component={Link}
              href={`/${item.username}/network/following`}
            >
              {formatNumber(item.conn.followingCount)} Following
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Paper>
    <RequestPopover
        open={open}
        anchorEl={anchorEl}
        onClose={onClosePopover}
        onAction={handleAction}
      />
    </React.Fragment>
  );
};


export default BlockMuteCard;
