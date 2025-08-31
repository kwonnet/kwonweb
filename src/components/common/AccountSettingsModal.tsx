"use client";
import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import {
  Box,
  Checkbox,
  Divider,
  FormControl,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Radio,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuthSession } from "@/hooks";
import { useNotifications } from "@toolpad/core";
import {
  blockUser,
  muteUser,
  updateAccountState,
} from "@/lib/users";
import { UserAccountStatus, UserMiniProfile } from "@/types/user";
import { getErrorMessage } from "@/utils";
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';


const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function AccountSettingsModal({
  open,
  toggle,
  user,
  onMetaUpdate,
}: {
  open: boolean;
  toggle: (open: boolean) => void;
  user: UserMiniProfile;
  onMetaUpdate?: (meta: Partial<UserMiniProfile["meta"]>) => void;
}) {
  const { token } = useAuthSession();

  const isOpen = React.useMemo(() => open, [open]);

  const notif = useNotifications();

  const [state, setState] = React.useState<{
    user: UserMiniProfile;
  }>({ user });

  const handleDeactivateAccount = async (status: UserAccountStatus) => {
    try {
      console.log("onReactivateAccount ", status)

      const result = await updateAccountState(
      { userId: state.user.id, status },
      token
    );
    console.log("activation result", result)
    const isPrivate = status === UserAccountStatus.PRIVATE
    onMetaUpdate && onMetaUpdate({ accountStatus: status, isPrivate });
    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        meta: {
          ...prev.user?.meta,
          accountStatus: status,
          isPrivate
        },
      },
    }));
    } catch (error) {
      notif.show(getErrorMessage(error), { severity: "error", autoHideDuration: 3000})
    }
  };

  const isPrivate = state?.user?.meta?.isPrivate

  const isDeactivated = state?.user?.meta?.accountStatus === "DEACTIVATED";

  const isSuspended =
    state?.user?.meta?.accountStatus === "BANNED" ||
    state?.user?.meta?.accountStatus === "SUSPENDED";

  return (
    <React.Fragment>
      <Dialog
        open={isOpen}
        keepMounted
        onClose={() => {
          toggle(false);
        }}
        aria-describedby="alert-dialog-slide-description"
        slots={{
          transition: Transition,
        }}
      >
        <Stack direction={"row"} justifyContent={"space-between"}  alignItems={"center"} sx={{mr: 1}}>
          <DialogTitle>Account Settings</DialogTitle>
          <Box>
            <IconButton onClick={ev => toggle(false) }>
            <CloseOutlinedIcon />
          </IconButton>
          </Box>
        </Stack>
        <Divider variant="fullWidth" />
        <DialogContent>
          <Box>
            <Typography sx={{ py: 1 }} variant="h5" color="text.secondary">
              Make your account private or public
            </Typography>
            <Stack direction={"row"} spacing={1}>
              <Typography variant="caption" color="warning">
                Private:
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Only users you followed or followed you can view your profile.
                Subsequent follow will be sent as requests and must be approved
                by your before they will be accepted as your followers and can
                view your profile.
              </Typography>
            </Stack>
            <Stack direction={"row"} spacing={1}>
              <Typography variant="caption" color="warning">
                Public:
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Anyone can follow you or view your profile.
              </Typography>
            </Stack>
            <Stack direction={"row"} spacing={1}>
              <Typography variant="caption" color="warning">
                Status:
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {/* {isPrivate ? "Private" : "Public"} */}
                {state?.user?.meta?.accountStatus}
              </Typography>
            </Stack>

            <Box sx={{ display: "block", textAlign: "center", my: 2 }}>
              <Button
                sx={{ width: "100%", maxWidth: "300px", borderRadius: 30 }}
                variant="outlined"
                color={!isPrivate ? "warning" : "info"}
                disabled={isSuspended}
                onClick={(ev) => {
                  ev.stopPropagation()
                  ev.preventDefault()
                  handleDeactivateAccount(isPrivate ? UserAccountStatus.ACTIVE : UserAccountStatus.PRIVATE )
                }}
              >
                {isPrivate
                  ? "Make Account Public"
                  : "Make Account Private"}
              </Button>
            </Box>
            <Typography sx={{ py: 1 }} variant="h5" color="textDisabled">
              Deactivate or Restore your account
            </Typography>
            <Stack direction={"row"} spacing={1}>
              <Typography variant="caption" color="warning">
                Note:
              </Typography>
              <Typography variant="caption" color="text.secondary">
                No one can follow you or view your profile.
              </Typography>
            </Stack>
            <Stack direction={"row"} spacing={1}>
              <Typography variant="caption" color="warning">
                Status:
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {state?.user?.meta?.accountStatus}
              </Typography>
            </Stack>
            <Box sx={{ display: "block", textAlign: "center", my: 2 }}>
              <Button
                sx={{ width: "100%", maxWidth: "300px", borderRadius: 30 }}
                variant="outlined"
                color={!isDeactivated ? "error" : "info"}
                disabled={isSuspended}
                onClick={(ev) => {
                  ev.stopPropagation()
                  ev.preventDefault()
                  handleDeactivateAccount(isDeactivated ? UserAccountStatus.ACTIVE : UserAccountStatus.DEACTIVATED )
                }}
              >
                {isDeactivated ? "Restore" : "Deactivate"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}
