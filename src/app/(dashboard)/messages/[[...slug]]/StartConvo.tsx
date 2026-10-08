"use client";
import NewConversationButton from "./NewConversationButton";
import { Box } from "@mui/material";


export default function StartConvo() {
  return <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", minHeight: 0}}>
    <Box sx={{ display: { xs: "none", md: "block" } }}><NewConversationButton /></Box>
  </Box>;
}
