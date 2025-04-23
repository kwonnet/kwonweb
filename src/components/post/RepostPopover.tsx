import React from "react";
import { Box, Stack, Typography, Popover } from "@mui/material";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import EqualizerOutlinedIcon from "@mui/icons-material/EqualizerOutlined";
import Link from "next/link";

interface RepostPopoverProps {
  open: boolean;
  anchorEl: HTMLButtonElement | null;
  onClose: () => void;
  hasReposted: boolean;
  onRepost: (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onQuote: (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onViewQuotes: (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const RepostPopover: React.FC<RepostPopoverProps> = ({
  open,
  anchorEl,
  onClose,
  hasReposted,
  onRepost,
  onQuote,
  onViewQuotes,
}) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      onClick={(ev) => ev.stopPropagation()}
    >
      <Box sx={{ p: 1 }}>
        <Stack
          direction="row"
          sx={(theme) => ({
            alignItems: "center",
            cursor: "pointer",
            py: 1,
            color: hasReposted ? theme.vars.palette.success.light : "inherit",
          })}
          spacing={2}
          onClick={onRepost}
        >
          <RepeatOutlinedIcon
            sx={{
              height: 16,
              width: 16,
              transform: "rotate(90deg)",
            }}
          />
          <Typography>{hasReposted ? "Un-repost": "Repost"}</Typography>
        </Stack>
        <Stack
          direction="row"
          sx={{ alignItems: "center", cursor: "pointer", py: 1 }}
          spacing={2}
          onClick={onQuote}
        >
          <BorderColorOutlinedIcon
            sx={{
              height: 16,
              width: 16,
            }}
          />
          <Typography>Quote</Typography>
        </Stack>
        <Stack
          direction="row"
          sx={{ alignItems: "center", cursor: "pointer", py: 1 }}
          spacing={2}
          onClick={onViewQuotes}
        >
          <EqualizerOutlinedIcon
            sx={{
              height: 16,
              width: 16,
            }}
          />
          <Typography>View Quotes</Typography>
        </Stack>
      </Box>
    </Popover>
  );
};

export default RepostPopover;