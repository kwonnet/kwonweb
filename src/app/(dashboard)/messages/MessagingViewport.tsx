"use client";
import { Box } from "@mui/material";
import { useConvoSocketIoContext } from "@/context/ConvoSocketIoContext";
import type { ReactNode } from "react";

// Size the messaging content inside the dashboard, never the entire app shell.
export default function MessagingViewport({ children }: { children: ReactNode }) {
  const { viewportHeight } = useConvoSocketIoContext();
  const height = viewportHeight ? `${Math.max(0, viewportHeight - 64)}px` : "calc(100dvh - 64px)";
  return <Box data-messaging-viewport sx={{ height, maxHeight: height, minHeight: 0, minWidth: 0, width: "100%", overflow: "hidden" }}>{children}</Box>;
}
