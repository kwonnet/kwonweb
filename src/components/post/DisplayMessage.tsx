"use client";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import React from "react";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import { WarningAmberOutlined } from "@mui/icons-material";

const DisplayMessage = ({
  message,
  actionHandler,
  showActionBtn = false,
  btnText = "View"
}: {
  message?: string;
  showActionBtn?: boolean;
  actionHandler?: () => void;
  btnText?: string
}) => {
  return (
    <Box
      sx={[
        (theme) => ({
          border: `1px solid ${theme.vars.palette.divider}`,
          p: 2,
          my: 1,
          mx: 2,
        }),
      ]}
    >
      <Stack direction={"row"} alignItems={"center"} justifyContent={"center"}>
        <IconButton color="warning">
          <WarningAmberOutlined />
        </IconButton>
        <Typography>{message}</Typography>
      </Stack>
      {showActionBtn && (
        <Box sx={{ textAlign: "center", display: "block" }}>
          <Button
            onClick={() => (actionHandler ? actionHandler() : undefined)}
            sx={{ borderRadius: 30 }}
            size="small"
            variant="outlined"
            color="inherit"
          >
            {btnText}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default DisplayMessage;
