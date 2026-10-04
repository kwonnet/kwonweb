"use client";
import { cancelSubscription } from "@/lib/subscriptions";
import { formatDateTime, getErrorMessage } from "@/utils";
import {
  Box,
  Button,
  Chip,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { Subscription } from "@/types";
import { useAuthSession } from "@/hooks";
import Link from "next/link";
import { useNotifications } from "@/providers/NotificationsProvider";
import { isError } from "lodash";

const DisplayItem = ({
  data,
  handleAction,
}: {
  data: Subscription;
  handleAction: () => void;
}) => {
  const { user, token } = useAuthSession();

  const notif = useNotifications();

  const [state, setState] = useState({ loading: false, open: false });

  const toggleDialog = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, open: true }));
  };

  const handleCancel = () => {
    setState((prev) => ({ ...prev, open: false }));
  };

  const handleConfirm = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, open: false }));
      const result = await cancelSubscription(data?.id, token);
      const isError = !result.data;
      notif.show(result.message, {
        severity: isError ? "error" : "success",
        autoHideDuration: 2500,
      });
      if (!isError) {
        // mutate()
        handleAction();
      }
    } catch (error) {
      notif.show(getErrorMessage(error), { severity: "error", autoHideDuration: 2500 });
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleClose = async (isOk: boolean) => {
    if (isOk) {
      await handleConfirm();
    } else {
      handleCancel();
    }
  };

  const planTier = data.plan.tier.find(
    (item) => item.id === data?.meta?.tierId
  );

  return (
    <Box>
      <Paper sx={{ py: 1, px: 2, justifyContent: "center" }}>
        <Typography
          sx={{
            fontFamily: "PlayFair",
            fontStyle: "italic",
            textAlign: "center",
          }}
          variant="h3"
        >
          My current plan
        </Typography>
        <Divider />
        <Typography
          sx={{ fontFamily: "PlayFair", fontStyle: "italic" }}
          variant="h4"
        >
          {data.plan.name} plan {planTier ? `- ${planTier.name} tier` : null}
        </Typography>
        {data.billingCycle === "YEARLY" ? (
          <Box>
            <Stack spacing={1} direction={"row"} sx={{ alignItems: "center" }}>
              <Typography sx={{ fontFamily: "PlayFair" }} variant="subtitle1">
                Annual Plan{" "}
              </Typography>
              <Chip
                size="small"
                color="default"
                label={data.plan.accountType}
              />
            </Stack>
            <Typography sx={{ fontFamily: "PlayFair" }} variant="h6">
              $
              {(
                (planTier ? planTier.price : data.plan.price) *
                (1 - data.plan.discount)
              ).toFixed(2)}{" "}
              / month{" "}
            </Typography>
            <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
              $
              {(
                (planTier ? planTier.price : data.plan.price) *
                (1 - data.plan.discount) *
                12
              ).toFixed(2)}{" "}
              per year, billed annually{" "}
            </Typography>
          </Box>
        ) : (
          <Box>
            <Stack spacing={1} direction={"row"} sx={{ alignItems: "center" }}>
              <Typography sx={{ fontFamily: "PlayFair" }} variant="subtitle1">
                Monthly Plan{" "}
              </Typography>
              <Chip
                size="small"
                color="default"
                label={data.plan.accountType}
              />
            </Stack>
            <Typography sx={{ fontFamily: "PlayFair" }} variant="h6">
              ${(planTier ? planTier.price : data.plan.price).toFixed(2)} /
              month{" "}
            </Typography>
            <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
              ${((planTier ? planTier.price : data.plan.price) * 12).toFixed(2)}{" "}
              per year, billed monthly{" "}
            </Typography>
          </Box>
        )}

        <Typography sx={{ fontFamily: "PlayFair" }} variant="h6">
          Next billing circle{" "}
        </Typography>
        <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
          {formatDateTime(data.endDate)}
        </Typography>

        <Stack spacing={1} direction={"row"} sx={{ alignItems: "center" }}>
          <Typography sx={{ fontFamily: "PlayFair" }} variant="subtitle1">
            Status:
          </Typography>
          <Chip size="small" color="default" label={data.status} />
        </Stack>

        <Stack
          direction={"row"}
          spacing={2}
          sx={{ justifyContent: "space-between", py: 2 }}
        >
          {data.status === "ACTIVE" ? (
            <Box sx={{ textAlign: "center", display: "block" }}>
              <Button
                variant="outlined"
                onClick={(ev) => toggleDialog(ev)}
                color="error"
                loading={state.loading}
              >
                Cancel Plan
              </Button>
            </Box>
          ) : null}
          <Box sx={{ textAlign: "center", display: "block" }}>
            <Button
              variant="outlined"
              href="/subscribe"
              LinkComponent={Link}
              color="info"
            >
              Change Plan
            </Button>
          </Box>
        </Stack>
      </Paper>
      <Dialog open={state.open} onClose={handleCancel} aria-labelledby="cancel-subscription-title">
        <DialogTitle id="cancel-subscription-title">Cancel Subscription Plan</DialogTitle>
        <DialogContent>Are you sure you want to cancel this plan?</DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} autoFocus>No</Button>
          <Button color="warning" disabled={state.loading} onClick={handleConfirm}>Yes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DisplayItem;
