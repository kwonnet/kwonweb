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
  List,
  ListItem,
  ListItemText,
  Radio,
  TextField,
  Typography,
} from "@mui/material";
import { FeedPost, ReportReasonCode } from "@/types";
import { deletePost, reportPost } from "@/lib/posts";
import { useAuthSession } from "@/hooks";
import { useNotifications } from "@/providers/NotificationsProvider";
import { blockUser, muteUser, reportUser } from "@/lib/users";
import { UserMiniProfile } from "@/types/user";

export const reportReasons = [
  {
    code: ReportReasonCode.HATE,
    title: "Hate",
    description:
      "Hateful behavior, slurs, dehumanization, inciting discrimination, or promoting hateful symbols or ideologies.",
  },
  {
    code: ReportReasonCode.ABUSE,
    title: "Abuse & Harassment",
    description:
      "Insults, harassment, unwanted sexual content, violent event denial, or encouraging others to harass.",
  },
  {
    code: ReportReasonCode.VIOLENCE,
    title: "Violent Speech",
    description:
      "Threats, glorifying or inciting violence, wishing harm, or using coded language to promote violence.",
  },
  {
    code: ReportReasonCode.CHILD_SAFETY,
    title: "Child Safety",
    description:
      "Content involving child exploitation, grooming, abuse, or participation by underage individuals.",
  },
  {
    code: ReportReasonCode.PRIVACY,
    title: "Privacy Violation",
    description:
      "Sharing private information, non-consensual images, or threatening to expose someone's personal data.",
  },
  {
    code: ReportReasonCode.SPAM,
    title: "Spam",
    description:
      "Fake engagement, scams, misleading links, or inauthentic activity to deceive others.",
  },
  {
    code: ReportReasonCode.SELF_HARM,
    title: "Suicide or Self-Harm",
    description:
      "Encouraging, promoting, or providing methods related to self-harm or suicide.",
  },
  {
    code: ReportReasonCode.SENSITIVE_MEDIA,
    title: "Sensitive or Disturbing Media",
    description:
      "Graphic violence, gore, adult nudity, violent sexual conduct, or other highly disturbing content.",
  },
  {
    code: ReportReasonCode.IMPERSONATION,
    title: "Impersonation",
    description:
      "Pretending to be another person, organization, or brand without clear indication or permission.",
  },
  {
    code: ReportReasonCode.VIOLENT_ENTITIES,
    title: "Violent or Hateful Entities",
    description:
      "Support or promotion of violent groups, terrorist organizations, or extremist networks.",
  },
  {
    code: ReportReasonCode.COPYRIGHT,
    title: "Copyright Violation",
    description:
      "Unauthorized use, reproduction, or distribution of copyrighted content.",
  },
];

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ReportUserModal({
  open,
  toggle,
  user,
  onActionsUpdate,
  reloadOnSubmit = false
}: {
  open: boolean;
  toggle: (open: boolean) => void;
  user: UserMiniProfile;
  reloadOnSubmit?: boolean
  onActionsUpdate?: (actions: Partial<UserMiniProfile["actions"]>) => void
}) {
  const { token } = useAuthSession();

  const isOpen = React.useMemo(() => open, [open]);

  const notif = useNotifications();

  const [state, setState] = React.useState<{
    user: UserMiniProfile,
    code?: ReportReasonCode;
    isNext: boolean;
    message?: string;
  }>({ user, code: undefined, isNext: false, message: undefined });

  const handleChange = (code: ReportReasonCode) => () => {
    setState((prev) => ({ ...prev, code }));
  };

  const toggleNext = (next: boolean) => {
    setState((prev) => ({ ...prev, isNext: next }));
  };

  const handleMessageChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, message: ev.target.value }));
  };

  const handleSubmit = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.preventDefault();
    try {
      toggle(false);
      if (!state.code) {
        notif.show("Please select a reason for reporting", {
          severity: "error",
          autoHideDuration: 3000,
        });
        return;
      }

      const result = await reportUser(
        {
          id: state?.user.id,
          code: state.code as ReportReasonCode,
          message: state.message,
          meta: reportReasons.find((r) => r.code === state.code) as {
            code: ReportReasonCode;
            title: string;
            description: string;
          },
        },
        token
      );
      const isError = !result.data;
      notif.show(result.message, {
        severity: isError ? "error" : "success",
        autoHideDuration: 3000,
      });
      if(!isError && reloadOnSubmit) {
        window.location.reload()
      }
    } catch (error) {
    } finally {
      setState((prev) => ({
        ...prev,
        code: undefined,
        isNext: false,
        message: undefined,
      }));
    }
  };

  const handleBlockUser = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    blockUser(state?.user?.id, token);
    onActionsUpdate && onActionsUpdate({isBlockedByUser: !state.user.actions.isBlockedByUser})
    setState(prev => ({...prev, user: { ...prev.user, actions: { ...prev.user?.actions, isBlockedByUser: !prev.user.actions.isBlockedByUser }}}))
  };

  const handleMuteUser = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    muteUser(state?.user?.id, token);
    onActionsUpdate && onActionsUpdate({isMutedByUser: !state.user.actions.isMutedByUser})
    setState(prev => ({...prev, user: { ...prev.user, actions: { ...prev.user?.actions, isMutedByUser: !prev.user.actions.isMutedByUser }}}))
  };

  return (
    <React.Fragment>
      <Dialog
        open={isOpen}
        keepMounted
        onClose={() => {
          setState((prev) => ({
            ...prev,
            isNext: false,
            code: undefined,
            message: undefined,
          }));
          toggle(false);
        }}
        aria-describedby="alert-dialog-slide-description"
        slots={{
          transition: Transition,
        }}
      >
        <DialogTitle>Report {`${state?.user.name}`}</DialogTitle>
        <Divider variant="fullWidth" />
        <DialogContent>
          <Typography variant="h6" id="alert-dialog-slide-description">
            {!state.isNext
              ? " What kind of issue are you reporting?"
              : "Additional information"}
          </Typography>
          {!state.isNext && (
            <Box>
              <List dense={true}>
                {reportReasons.map((reason) => (
                  <ListItem
                    key={reason.code}
                    secondaryAction={
                      <Radio
                        edge="end"
                        checked={reason.code === state.code}
                        onChange={(ev) =>
                          handleChange(ev.target.value as ReportReasonCode)()
                        }
                        value={reason.code}
                        name="radio-buttons"
                        slotProps={{ input: { "aria-label": "A" } }}
                      />
                    }
                  >
                    <ListItemText
                      primary={reason.title}
                      secondary={reason.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          {state.isNext && (
            <Box>
              <Typography variant="subtitle1" sx={{
                color: "text.secondary"
              }}>
                You can add additional comments to your report. This is
                optional, but it can help us understand the issue better.
              </Typography>
              <FormControl fullWidth>
                <TextField
                  id="outlined-multiline-static"
                  label="Additional comments (optional)"
                  multiline
                  rows={4}
                  variant="outlined"
                  sx={{ width: "100%", borderRadius: 30, my: 2 }}
                  value={state.message}
                  onChange={handleMessageChange}
                />
              </FormControl>
              <Typography variant="subtitle2" sx={{
                color: "text.secondary"
              }}>
                By making this report, you are helping us keep the community
                safe. Thank you for your vigilance!
              </Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                We know it wasn&apos;t easy, so we appreciate you taking the
                time to answer those questions.
              </Typography>
              <Typography variant="h6">What&apos;s happening now</Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                We received your report. We&apos;ll hide the reported post from
                your timeline in the meantime.
              </Typography>
              <Typography variant="h6">What happens next</Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                We&apos;ll review the report and take appropriate action if
                necessary. If we find that the user violates our community
                guidelines, we may suspend the user and take further action
                against the user.
              </Typography>

              <Typography variant="h6">
                What you can do for the meantime?
              </Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Remove @{state?.user.username} posts from your timeline without
                unfollowing or blocking them.
              </Typography>
              <Box sx={{ display: "block", textAlign: "center", my: 2 }}>
                <Button
                  sx={{ width: "100%", maxWidth: "300px", borderRadius: 30 }}
                  variant="outlined"
                  onClick={(ev) => handleMuteUser(ev)}
                >
                {state?.user?.actions?.isMutedByUser
                          ? "Unmute"
                          : "Mute"} @{state?.user.username}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Block @{state?.user.username} from following or messaging you. They
                will be able to see your public posts, but will no longer be
                able to engage with them. You also won&apos;t see any posts or
                notifications from @{state?.user.username}
              </Typography>
              <Box sx={{ display: "block", textAlign: "center", my: 2 }}>
                <Button
                  sx={{ width: "100%", maxWidth: "300px", borderRadius: 30 }}
                  variant="outlined"
                  onClick={(ev) => handleBlockUser(ev)}
                >
                  {state?.user?.actions?.isBlockedByUser
                          ? "Unblock"
                          : "Block"} @{state?.user.username}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Please note that reporting a user does not guarantee their
                suspension. Our team will review the report and take appropriate
                action.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <Divider variant="fullWidth" />
        <DialogActions sx={{ alignItems: "center", justifyContent: "center" }}>
          <Button
            variant="contained"
            onClick={(ev) =>
              state.isNext ? handleSubmit(ev) : toggleNext(true)
            }
            sx={{ width: "100%", maxWidth: "300px", borderRadius: 30 }}
            disabled={!state.code}
          >
            {!state.isNext ? "Next" : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
