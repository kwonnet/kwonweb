"use client";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { VideoUploadProgress as Progress } from "@/utils/stream-upload";
const labels = {
  queued: "Waiting",
  uploading: "Uploading",
  paused: "Paused",
  retrying: "Reconnecting",
  processing: "Processing video",
  ready: "Ready to publish",
  error: "Upload incomplete",
};
export default function VideoUploadProgress({
  uploads,
  pause,
  resume,
  cancel,
}: {
  uploads: Progress[];
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}) {
  if (!uploads.length) return null;
  const busy = uploads.some((u) => !["ready", "error"].includes(u.phase));
  return (
    <Box
      sx={{
        mx: 2,
        mb: 2,
        p: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "action.hover",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
      >
        <Typography variant="subtitle2">Preparing your videos</Typography>
        {busy && (
          <Button size="small" color="inherit" onClick={cancel}>
            Cancel uploads
          </Button>
        )}
      </Stack>
      <Stack spacing={2}>
        {uploads.map((upload) => (
          <Box key={upload.id}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <Typography
                variant="body2"
                noWrap
                sx={{ flex: 1 }}
                title={upload.name}
              >
                {upload.name}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                color={
                  upload.phase === "ready"
                    ? "success"
                    : upload.phase === "error"
                      ? "error"
                      : "default"
                }
                label={labels[upload.phase]}
              />
              {upload.phase === "paused" ? (
                <Button size="small" onClick={resume}>
                  Resume
                </Button>
              ) : (
                ["uploading", "retrying"].includes(upload.phase) && (
                  <Button size="small" onClick={pause}>
                    Pause
                  </Button>
                )
              )}
            </Stack>
            <LinearProgress
              aria-label={`${upload.name}: ${labels[upload.phase]}`}
              variant={
                upload.phase === "processing" && !upload.percent
                  ? "indeterminate"
                  : "determinate"
              }
              value={upload.percent}
              color={
                upload.phase === "error"
                  ? "error"
                  : upload.phase === "ready"
                    ? "success"
                    : "primary"
              }
              sx={{ height: 5, borderRadius: 3 }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              role="status"
              sx={{ display: "block", mt: 0.5 }}
            >
              {upload.message ||
                (upload.phase === "ready"
                  ? "Video ready"
                  : `${upload.percent}%`)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
