"use client";
import { Box, Typography } from "@mui/material";
import NewConversationButton from "./NewConversationButton";

export default function StartConvo() {
  return <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", minHeight: 240}}>
    <Typography>Start a new conversation</Typography>
    <NewConversationButton />
  </Box>;
}
