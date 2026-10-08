"use client";
import { Box, Skeleton, Stack } from "@mui/material";
import { useConvoSocketIoContext } from "@/context/ConvoSocketIoContext";
import type { ReactNode } from "react";

// Size the messaging content inside the dashboard, never the entire app shell.
export default function MessagingViewport({ children }: { children: ReactNode }) {
  const { viewportHeight, messagingRestoring, messagingGate } = useConvoSocketIoContext();
  const height = viewportHeight ? `${Math.max(0, viewportHeight - 64)}px` : "calc(100dvh - 64px)";
  return <Box data-messaging-viewport sx={{ height, maxHeight: height, minHeight: 0, minWidth: 0, width: "100%", overflow: "hidden" }}>
    {messagingGate ?? (messagingRestoring ? <MessagingPaneSkeleton /> : children)}
  </Box>;
}

function MessagingPaneSkeleton() {
  return <Stack role="status" aria-label="Unlocking encrypted messages" aria-busy="true" direction="row" spacing={2} sx={{ height: "100%", p: 2, overflow: "hidden" }}>
    <Box sx={{ width: "32%", display: { xs: "none", md: "block" } }}>
      <Skeleton variant="rounded" height={40} sx={{ mb: 3 }} />
      {Array.from({ length: 6 }, (_, index) => <Stack key={index} direction="row" spacing={1} sx={{ mb: 3 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}><Skeleton width="70%" /><Skeleton width="90%" /></Box>
      </Stack>)}
    </Box>
    <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
      <Skeleton variant="rounded" height={48} width="100%" />
      {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} variant="rounded" width={index % 2 ? "50%" : "65%"} height={64} sx={{ alignSelf: index % 2 ? "flex-end" : "flex-start" }} />)}
      <Box sx={{ flex: 1 }} />
      <Skeleton variant="rounded" height={48} width="100%" />
    </Stack>
  </Stack>;
}
