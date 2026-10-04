"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Container,
  Paper,
} from "@mui/material";
import { useAuthSession } from "@/hooks";
import { subscribeUserToPush } from "@/utils/pushClient";
import { useNotifications } from "@/providers/NotificationsProvider";

const PageClient = () => {
  const { token } = useAuthSession();

  const notif = useNotifications();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleToggleNotifications = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const result = await subscribeUserToPush(token);
      notif.show(result.message, {
        severity: result.status === 200 ? "success" : "error",
        autoHideDuration: 2500,
      });
      if (result.status === 200) {
        setNotificationsEnabled(event.target.checked);
      }
    } catch (error) {}
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Settings
        </Typography>
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={notificationsEnabled}
                onChange={handleToggleNotifications}
                color="primary"
              />
            }
            label={
              <Typography variant="body1">Enable Notifications</Typography>
            }
          />
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mt: 2
          }}>
          Notifications are currently{" "}
          {notificationsEnabled ? "enabled" : "disabled"}.
        </Typography>
      </Paper>
    </Container>
  );
};

export default PageClient;
