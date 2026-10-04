"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import {
  ClickAwayListener,
  Grow,
  ListItemIcon,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from "@mui/material";
import { useAuthSession } from "@/hooks";
import DoNotDisturbOnTotalSilenceOutlinedIcon from "@mui/icons-material/DoNotDisturbOnTotalSilenceOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import OutlinedFlagOutlinedIcon from "@mui/icons-material/OutlinedFlagOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import { getErrorMessage } from "@/utils";
import { useNotifications } from "@/providers/NotificationsProvider";
import { useRouter } from "next/navigation";
import { blockUser, muteUser } from "@/lib/users";
import { getUserConnInfo } from "@/utils/connections";
import { UserMiniProfile } from "@/types/user";
import { appUrl } from "@/config";
import AccountSettingsModal from "@/components/common/AccountSettingsModal";
import ReportUserModal from "@/components/common/ReportUserModal";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import AdsClickOutlinedIcon from "@mui/icons-material/AdsClickOutlined";
import Link from "next/link";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";

const ProfileOptions = ({
  visitedUser,
  open,
  anchorRef,
  handleClose,
  handleListKeyDown,
  onActionsUpdate,
  onMetaUpdate
}: {
  visitedUser: UserMiniProfile;
  open: boolean;
  handleClose: (event: Event | React.SyntheticEvent) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  handleListKeyDown: (event: React.KeyboardEvent) => void;
  onActionsUpdate: (actions: Partial<UserMiniProfile["actions"]>) => void;
  onMetaUpdate: (meta: Partial<UserMiniProfile["meta"]>) => void
}) => {
  const { user, token } = useAuthSession();

  const isCurrentUser = user.id === visitedUser?.id;

  const { isFriends } = getUserConnInfo(visitedUser?.conn);

  const [state, setState] = useState({
    open: false,
    isPostReport: false,
    openDialog: false,
  });

  const notif = useNotifications();

  const router = useRouter();

  const toggle = (open: boolean) => {
    setState((prev) => ({ ...prev, open }));
  };

  const handleReportToggle = (
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>,
    isPostReport: boolean
  ) => {
    setState((prev) => ({ ...prev, isPostReport, open: true }));
    handleClose(ev);
  };

  const toggleAccountModal = (open: boolean) => {
    setState((prev) => ({ ...prev, openDialog: open }));
  };

  const handleLinkCopy = (ev: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    const url = `${appUrl}/@${visitedUser?.username}`;
    navigator.clipboard.writeText(url);
    notif.show("Link copied", {
      severity: "info",
      autoHideDuration: 2000,
    });
    handleClose(ev);
  };

  const handleAdsCampaign = (
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    handleClose(ev);
    router.push(`/advertise`);
  };

  const handlePromote = (ev: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    handleClose(ev);
    // router.push(`/@${visitedUser?.username}/promotes`);
  };

  const handleAnalytics = (ev: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    handleClose(ev);
    router.push(`/@${visitedUser?.username}/analytics`);
  };

  const handleBlockUser = async (
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    try {
      await blockUser(visitedUser?.id, token);
      window.location.reload();
    } catch (error) {
      notif.show(getErrorMessage(error), {
        severity: "error",
        autoHideDuration: 3000,
      });
    } finally {
      handleClose(ev);
    }
  };

  const handleMuteUser = (ev: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    const muted = !visitedUser?.actions?.isMutedByUser;
    notif.show(
      muted ? `${visitedUser?.name} muted ` : `${visitedUser?.name} unmuted`,
      {
        severity: muted ? "warning" : "info",
        autoHideDuration: 3000,
      }
    );
    onActionsUpdate && onActionsUpdate({ isMutedByUser: muted });
    muteUser(visitedUser?.id, token);
    handleClose(ev);
  };

  return (
    <Box>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement="bottom-start"
        transition
        disablePortal
        sx={{ zIndex: 999999999, overflow: "auto" }}
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom-start" ? "left top" : "left bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={open}
                  id="composition-menu"
                  aria-labelledby="composition-button"
                  onKeyDown={handleListKeyDown}
                >
                  {/* {isCurrentUser && (
                    <MenuItem onClick={ev => handleAdsCampaign(ev)}>
                      <ListItemIcon>
                        <CampaignOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      Ads Campaign
                    </MenuItem>
                  )}

                  {isCurrentUser && (
                    <MenuItem onClick={(ev) => handlePromote(ev)}>
                      <ListItemIcon>
                        <AdsClickOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      Promote
                    </MenuItem>
                  )} */}

                  {isCurrentUser && (
                    <MenuItem onClick={(ev) => handleAnalytics(ev)}>
                      <ListItemIcon>
                        <BarChartOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      Analytics
                    </MenuItem>
                  )}

                  {!isCurrentUser && (
                    <MenuItem onClick={(ev) => handleMuteUser(ev)}>
                      <ListItemIcon>
                        <DoNotDisturbOnTotalSilenceOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      {visitedUser?.actions?.isMutedByUser ? "Unmute" : "Mute"}
                    </MenuItem>
                  )}
                  {!isCurrentUser && (
                    <MenuItem onClick={(ev) => handleBlockUser(ev)}>
                      <ListItemIcon>
                        <BlockOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      {visitedUser?.actions?.isBlockedByUser
                        ? "Unblock"
                        : "Block"}
                    </MenuItem>
                  )}

                  <MenuItem onClick={(ev) => handleLinkCopy(ev)}>
                    <ListItemIcon>
                      <LinkOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    Copy link
                  </MenuItem>

                  {isCurrentUser && (
                    <MenuItem
                      onClick={(ev) => {
                        handleClose(ev);
                        toggleAccountModal(true);
                      }}
                    >
                      <ListItemIcon>
                        <ManageAccountsOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      Settings
                    </MenuItem>
                  )}

                  {!isCurrentUser && (
                    <MenuItem
                      onClick={(ev) => {
                        ev.preventDefault();
                        handleReportToggle(ev, true);
                      }}
                    >
                      <ListItemIcon>
                        <OutlinedFlagOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      Report user
                    </MenuItem>
                  )}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
      <ReportUserModal
        user={visitedUser}
        open={state.open}
        toggle={toggle}
        reloadOnSubmit={true}
        onActionsUpdate={onActionsUpdate}
      />

      <AccountSettingsModal
        user={visitedUser}
        open={state.openDialog}
        toggle={toggleAccountModal}
        onMetaUpdate={onMetaUpdate}
        
      />
    </Box>
  );
};

export default ProfileOptions;
