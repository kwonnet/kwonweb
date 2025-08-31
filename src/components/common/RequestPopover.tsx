import React from "react";
import { Box, Popover, Button, Stack } from "@mui/material";
import { Check, Remove } from "@mui/icons-material";
import { FollowAction } from "@/types/user";

interface PopoverProps {
  open: boolean;
  anchorEl: HTMLButtonElement | null;
  onClose: () => void;
  onAction: (action: FollowAction) => void;
}

const RequestPopover: React.FC<PopoverProps> = ({
  open,
  anchorEl,
  onClose,
  onAction,
}) => {

    const handleAction = (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>, action: FollowAction) => {
        onClose()
        onAction(action)
    }
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
        <Stack direction={"column"} spacing={2}>
          <Button
            onClick={(ev) => handleAction(ev,FollowAction.ACCEPT)}
            sx={{ borderRadius: 30 }}
            size="small"
            variant="outlined"
            color="info"
            startIcon={<Check />}
          >
            Accept
          </Button>
          <Button
            onClick={(ev) =>handleAction(ev, FollowAction.REJECT)}
            sx={{ borderRadius: 30 }}
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Remove />}
          >
            Reject
          </Button>
        </Stack>
      </Box>
    </Popover>
  );
};

export default RequestPopover;
