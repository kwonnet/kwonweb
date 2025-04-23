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
import { useSession } from "@toolpad/core";
// import { getUserNotificationStats, updateUserNotification } from "@/lib/actions/notifications";

const fetcher = cache(async ({ id }: { id: string }) => {
  const stats = {
      totalUnseenCount: 23,
      totalUnreadCount: 17,
    };
    // const result = await getUserNotificationStats(id);
    // return result.data ? result.data : stats;
    return stats
})

const NotificationContainer = ({
  stats,
  data,
}: {
  stats: { totalUnseenCount: number; totalUnreadCount: number };
  data: any[];
}) => {
  const session = useSession();

  const { data: notifStats, mutate } = useSWR(
    { type: "notif_stats", id: session?.user?.id },
    fetcher,
    {
      fallbackData: stats,
    }
  );

  const handleUpdateUnseenNotif = async () => {
    if (
      !session?.user ||
      !session?.user?.id ||
      notifStats?.totalUnseenCount === 0
    )
      return;
    // await updateUserNotification(
    //   { userId: session?.user.id },
    //   { isSeen: true }
    // );
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
                  handleUpdateUnseenNotif()
                }}
              >
                <Badge
                  color="error"
                  badgeContent={notifStats.totalUnseenCount}
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
              slotProps={{
                paper: {
                  sx: {
                    width: 400,
                    minHeight: 300,
                    maxHeight: "90vh",
                  },
                },
              }}
            >
              <Box sx={{ px: 1, pb: 2 }}>
                <Box>
                  <Stack
                    direction={"row"}
                    justifyContent={"space-between"}
                    alignItems={"center"}
                  >
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
                <Divider variant="fullWidth" />
                <Box>
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
