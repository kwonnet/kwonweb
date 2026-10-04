"use client";
import {
  Badge,
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import AccountMenu from "./AccountMenu";
import React from "react";
import SearchToolbar from "./SearchToolbar";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import Link from "next/link";
import AccountToolbar from "./AccountToolbar";
// import AccountContent from "./AccountContent";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import { useAuthSession } from "@/hooks";
import { useUserStats } from "@/lib/swrHooks";
import { updateUserConversations } from "@/lib/conversations";

const CustomToolbarActions = (props: {
  NotificationNode?: React.ReactNode;
  AccountNode?: React.ReactNode;
}) => {



  const { user, token } = useAuthSession();

  const { data: stats, mutate } = useUserStats({ userId: user?.id, token})

  const updateMsgUnseen = async() => {
    if (!user?.id || stats?.totalUnseenMsg === 0) return;
    await updateUserConversations({ userId: user.id, isSeen: true }, token);
    mutate();
  }

  if (!token) return <Stack direction="row" spacing={1}>
    <Button href="/?auth=signin" data-auth-mode="signin">Log in</Button>
    <Button href="/?auth=signup" data-auth-mode="signup" variant="contained" sx={{ borderRadius: 5 }}>Sign up</Button>
  </Stack>;

  return (
    <React.Fragment>
      <Stack
        suppressHydrationWarning
        direction="row"
        spacing={{lg: 2, md: 2, sm: 1, xs: 1}}
        sx={{
          alignItems: "center"
        }}
      >
        <SearchToolbar />
        <Tooltip title="Store" suppressHydrationWarning>
          <Box sx={{ display: "contents" }}>
            <IconButton sx={{ display: { xs: "inline-flex", sm: "none" } }} size="small" LinkComponent={Link} href="/store">
              <LocalMallOutlinedIcon />
            </IconButton>
            <Button
              size="small"
              href="/store"
              LinkComponent={Link}
              variant="outlined"
              sx={{ borderRadius: 30, display: { xs: "none", sm: "inline-flex" } }}
              startIcon={<LocalMallOutlinedIcon />}
            >
              Store
            </Button>
          </Box>
        </Tooltip>
          <Tooltip title="Messages" suppressHydrationWarning>
            <IconButton onClick={() => updateMsgUnseen()} size="small" LinkComponent={Link} href="/messages">
              <Badge
                color="error"
                badgeContent={stats.totalUnseenMsg}
                max={99}
              >
                <EmailOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        {props.NotificationNode}

        <AccountMenu />
      </Stack>
    </React.Fragment>
  );
};

export default CustomToolbarActions;
