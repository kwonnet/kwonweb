"use client";
import { Add } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import React from "react";

const StartConvo = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        maxHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <Typography>Start a new conversation</Typography>
      <IconButton
        size="large"
        color="primary"
        
        sx={[
          (theme) => ({
            // color: "common.white",
            // ...theme.applyStyles("dark", {
            //   color: "text.white",
            // }),
          }),
        ]}
      >
        <Add />
      </IconButton>
    </Box>
  );
};

export default StartConvo;
