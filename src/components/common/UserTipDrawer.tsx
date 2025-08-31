"use client";
import {
  Box,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Button,
  Dialog,
  DialogContent,
  Paper,
  Grid,
  Typography,
  DialogActions,
  TextField,
  Switch,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import React, { useState } from "react";
import { formatNumber, getErrorMessage } from "@/utils";
import { useAuthSession } from "@/hooks";
import { useNotifications } from "@toolpad/core";
import { useSWRTipPackages } from "@/lib/tips/hooks";
import Link from "next/link";
import { useUserCoinsWallet } from "@/lib/swrHooks";
import { sendPostTip } from "@/lib/posts";
import { FeedPost } from "@/types";
type TipItem = {
  id: string;
  name: string;
  price: number;
};
type LocalState = {
  loading: boolean;
  selected?: TipItem;
  isAnon: boolean;
  message?: string;
};
const initialState: LocalState = {
  loading: false,
  isAnon: false,
};
export default function UserTipDrawer({
  isOpen,
  toggleDrawer,
  postId,
  recipient
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  recipient: { id: string, name: string};
  postId?: string
}) {
  const open = React.useMemo(() => isOpen, [isOpen]);

  const { user, token } = useAuthSession();

  const { data: wallet } = useUserCoinsWallet(token);

  const { data: tipPackages } = useSWRTipPackages(token);

  const [state, setState] = useState<LocalState>(initialState);

  const notif = useNotifications();

  const handleSubmit = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    try {
      ev.preventDefault();
      if (!wallet) {
        return notif.show("Wallet is not loaded", {
          severity: "error",
          autoHideDuration: 2500,
        });
      }
      if (!state.selected) {
        return notif.show("No tip is selected", {
          severity: "error",
          autoHideDuration: 2500,
        });
      }
      const debitAmount = Number((wallet.credit * 2.2).toFixed(2));
      const canSend =
        state.selected.price <= wallet.coins ||
        state.selected.price <= debitAmount;
      if (!canSend) {
        return notif.show(
          "Insufficient balance, please purchase coins to continue",
          {
            severity: "error",
            autoHideDuration: 2500,
          }
        );
      }
      // const result = await sendPostTip(
      //   {
      //     tipId: state.selected.id,
      //     isAnon: state.isAnon,
      //     timestamp: new Date().toISOString(),
      //     message: state.message,
      //     recipientId: recipient?.id,
      //     ...(postId && {postId })
      //   },
      //   token
      // );
      // const isError = !result.data;
      // notif.show(result.message, {
      //   severity: !isError ? "success" : "error",
      //   autoHideDuration: 2500,
      // });
      // if(!isError) {
      //   setState(initialState);
      //   toggleDrawer(ev, false)
      // }
    } catch (error) {
      notif.show(getErrorMessage(error), {
        severity: "error",
        autoHideDuration: 2500,
      });
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const onSelect = (item: TipItem) => {
    setState((prev) => ({ ...prev, selected: item }));
  };

  return (
    <div>
      <React.Fragment>
        <Dialog
          maxWidth="xl"
          sx={{
            zIndex: 9999,
          }}
          onClick={(ev) => ev.stopPropagation()}
          open={open}
          onClose={(ev) => {
            setState(initialState);
            toggleDrawer(ev, false);
          }}
          slotProps={{
            paper: {
              sx: {
                top: "0",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                zIndex: 9999,
                width: { lg: 600, md: 600, sm: "100%", width: "100%" },
                maxWidth: "100%",
                px: 0,
                maxHeight: "50vh",

              },
            },
            container: {
              sx: {
                minWidth: { lg: 600, md: 600, sm: "100%", width: "100%" },
                maxWidth: "100%",
              },
            },
          }}
        >
          <Stack
            direction={"row"}
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              mx: 1,
              my: 1,
            }}
          >
            <IconButton
              color="inherit"
              onClick={(ev) => {
                setState(initialState);
                toggleDrawer(ev, false);
              }}
            >
              <Close />
            </IconButton>
            <Box>
            <Typography>Do you want to tip {recipient?.name}?</Typography>
            <Typography variant="caption">We've made easier for you</Typography>
            </Box>
          </Stack>

          <DialogContent dividers sx={{ m: 0, p: 0 }}>
            <Box role="presentation">
              <Container maxWidth="xl" sx={{ mt: 1, pb: 2 }}>
                <Grid container spacing={2}>
                  {tipPackages?.map((item) => (
                    <Grid size={{ lg: 3, md: 3, sm: 6, xs: 6 }} key={item.id}>
                      <Paper
                        sx={[
                          (theme) => ({
                            py: 1,
                            px: 1,
                            height: "100%",
                            border:
                              state.selected?.id === item.id
                                ? `1px solid ${theme.vars.palette.warning.light}`
                                : "none",
                          }),
                        ]}
                        key={item.id}
                        elevation={state.selected?.id === item.id ? 6 : 4}
                        onClick={() => onSelect(item)}
                      >
                        <Typography variant="body2">{item.name}</Typography>
                        <Stack
                          alignItems={"center"}
                          spacing={0.5}
                          direction={"row"}
                        >
                          <Typography variant="caption">
                            {formatNumber(item.price)}
                          </Typography>
                          <Typography variant="caption"> Coins</Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ mt: 1 }}>
                  <Stack direction={"row"} alignItems={"center"}>
                    <Switch
                      value={state.isAnon}
                      onChange={(_ev, checked) =>
                        setState((prev) => ({ ...prev, isAnon: checked }))
                      }
                    />
                    <Typography variant="body2">Send Anonymously</Typography>
                  </Stack>
                  <TextField
                    placeholder="Optional message"
                    fullWidth
                    multiline
                    minRows={2}
                    value={state.message}
                    onChange={(ev) =>
                      setState((prev) => ({
                        ...prev,
                        message: ev.target.value,
                      }))
                    }
                  />
                </Box>
              </Container>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "space-between" }}>
            <Stack
              sx={{ width: "100%" }}
              direction={{lg: 'row', md: 'row', sm: "column", xs: "column"}}
              alignItems={"center"}
              justifyContent={"space-between"}
            >
              <Typography variant="body2">
                By continuing, you agree to <Link href={"/"}>our terms</Link>
              </Typography>
              <Tooltip title="Post">
                <Button
                  onClick={(ev) => handleSubmit(ev)}
                  variant="contained"
                  sx={{ borderRadius: 30 }}
                  color="primary"
                  loading={state.loading}
                  disabled={state.loading || !state.selected}
                  size="small"
                >
                  Send Tip
                </Button>
              </Tooltip>
            </Stack>
          </DialogActions>
        </Dialog>
      </React.Fragment>
    </div>
  );
}
