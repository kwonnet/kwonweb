"use client";
import { Box, Typography } from "@mui/material";


export default function StartConvo() {
  return <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", minHeight: 240}}>
    <Typography>Start a new conversation</Typography>
    <Typography variant="body2" color="text.secondary">Use the message button in your conversation list.</Typography>
  </Box>;
}
