"use client";
import {
  Badge,
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import type { UserStats } from "@/types/user";
import AccountMenu from "./AccountMenu";
import React from "react";
import SearchToolbar from "./SearchToolbar";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import Link from "next/link";
import AccountToolbar from "./AccountToolbar";
// import AccountContent from "./AccountContent";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import { useAuthSession } from "@/hooks";
import { useUserStats } from "@/lib/swrHooks";


const CustomToolbarActions = (props: {
  NotificationNode?: React.ReactNode;
  initialStats?: UserStats;
  initialUserId?: string;
  AccountNode?: React.ReactNode;
}) => {



  const { user, token } = useAuthSession();

  const { data: stats, mutate } = useUserStats({ userId: user?.id, token, fallbackData: user?.id === props.initialUserId ? props.initialStats : undefined })




  return (
    <React.Fragment>
      <Stack
        suppressHydrationWarning
        direction="row"
        spacing={{lg: 2, md: 2, sm: 1, xs: 1}}
        sx={{
          alignItems: "center",
          justifyContent: "flex-end",
          flex: {lg: 1},
          minWidth: 0
        }}
      >
        <SearchToolbar />
        <Tooltip title="Store" suppressHydrationWarning>
          <Box sx={{ display: "inline-flex", alignItems: "center" }}>
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
            <IconButton size="small" LinkComponent={Link} href="/messages">
              <Badge
                color="error"
                badgeContent={stats?.totalUnseenMsg ?? 0}
                max={99}
              >
                <EmailOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        {token ? props.NotificationNode : <Tooltip title="Notifications"><IconButton size="small" aria-label="Notifications" href="/?auth=signin"><NotificationsOutlinedIcon /></IconButton></Tooltip>}

        {token ? <AccountMenu /> : <Tooltip title="Log in"><IconButton size="small" aria-label="Log in" href="/?auth=signin"><AccountCircleIcon /></IconButton></Tooltip>}
      </Stack>
    </React.Fragment>
  );
};

export default CustomToolbarActions;
