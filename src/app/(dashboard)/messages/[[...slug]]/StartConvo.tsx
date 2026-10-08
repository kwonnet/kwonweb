"use client";
import NewConversationButton from "./NewConversationButton";
import { Box, Typography } from "@mui/material";


export default function StartConvo() {
  return <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", minHeight: 0}}>
    <Typography>Start a new conversation</Typography>
    <Box sx={{ display: { xs: "none", md: "block" }, mt: 2 }}><NewConversationButton /></Box>
  </Box>;
}
