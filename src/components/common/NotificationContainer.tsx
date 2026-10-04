"use client";
import React, { cache } from "react";
import PopupState, { bindTrigger, bindPopover } from "material-ui-popup-state";
import {
  Badge,
  Box,
  Divider,
  IconButton,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Link from "next/link";
import NotificationClient from "./NotificationClient";
import useSWR from "swr";

import { UserStats } from "@/types/user";
import { updateUserNotification } from "@/lib/users";
import { useAuthSession } from "@/hooks";
import { AppNotification } from "@/types";
import StickyBox from "react-sticky-box";
import { useUserStats } from "@/lib/swrHooks";
// import { getUserNotificationStats, updateUserNotification } from "@/lib/actions/notifications";

// const fetcher = cache(async ({ id }: { id: string }) => {
//     const result = await getUserNotificationStats(id);
//     return result.data ? result.data : stats;
//     return stats
// })

const NotificationContainer = ({
  stats,
  data,
}: {
  stats?: UserStats;
  data?: AppNotification[];
}) => {
  const { user, token } = useAuthSession();

  const { data: notifStats, mutate } = useUserStats({fallbackData: stats, userId: user?.id, token})

  const handleUpdateUnseenNotif = async () => {
    if (!user?.id || notifStats?.totalUnseenCount === 0) return;
    await updateUserNotification({ userId: user.id, isSeen: true }, token);
    mutate();
  };

  return (
    <React.Fragment>
      <PopupState variant="popover" popupId="demo-popup-popover">
        {(popupState) => (
          <div>
            <Tooltip title="Notifications">
              <IconButton
                size="medium"
                {...bindTrigger(popupState)}
                onClick={(e: React.MouseEvent) => {
                  bindTrigger(popupState).onClick(e);
                  handleUpdateUnseenNotif();
                }}
              >
                <Badge
                  color="error"
                  badgeContent={notifStats?.totalUnseenCount}
                  max={99}
                >
                  <NotificationsNoneOutlinedIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Popover
              {...bindPopover(popupState)}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
              sx={{ maxHeight: "100vh"}}
              slotProps={{
                paper: {
                  sx: {
                    width: 400,
                    minHeight: 300,
                    // maxHeight: "calc(100% - 0px)",
                    height: "calc(100vh - 60px)",
                    zIndex: 999999,
                    mt: 2,
                    // pb: 1
                  },
                },

              }}
            >
              <Box>
                <StickyBox style={{zIndex: 999}}>
                  <Box>
                  <Stack
                    direction={"row"}
                    sx={[{
                      justifyContent: "space-between",
                      alignItems: "center"
                    }, (theme) => ({
                      background: theme.vars.palette.AppBar.defaultBg,
                      p: 1
                    })]}>
                    <Typography>Notifications</Typography>
                    <Tooltip title="Settings">
                      <IconButton
                        LinkComponent={Link}
                        href="/settings"
                        size="small"
                        onClick={() => popupState.close()}
                      >
                        <SettingsOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
                </StickyBox>
                <Divider variant="fullWidth" />
                <Box sx={{ px: 1, pb: 2 }}>
                  <NotificationClient
                    items={data}
                    close={() => popupState.close()}
                  />
                </Box>
              </Box>
            </Popover>
          </div>
        )}
      </PopupState>
    </React.Fragment>
  );
};

export default NotificationContainer;
