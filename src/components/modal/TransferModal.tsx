"use client";
import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  FormControl,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { transferCoins } from "@/lib/coins";
import _debounce from "lodash/debounce";
import { searchUser } from "@/lib/users";
import { SendOutlined } from "@mui/icons-material";
import { toast } from "react-toastify";
import { formatNumberWithCommas, getErrorMessage, validateZodInput } from "@/utils";
import { TransferZodSchema } from "@/schema/coins";
import { useAuthSession } from "@/hooks";

type SearchUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
};

type LocalState = {
  userId: string;
  amount: number;
  totalAmount: number;
  identity: string;
  user: SearchUser | undefined;
  identityMessage: string;
  searching: boolean;
  loading: boolean;
};

export default function TransferModal({
  isOpen,
  toggle,
  onCompleted,
  coinBalance
}: {
  isOpen: boolean;
  toggle: () => void;
  onCompleted: () => void;
  coinBalance: number;
}) {
  const [state, setState] = React.useState<LocalState>({
    userId: "",
    amount: 0,
    totalAmount: 0,
    identity: "",
    user: undefined,
    identityMessage: "",
    searching: false,
    loading: false,
  });

  const { token, user } = useAuthSession();

  const debouchSearchUser = React.useRef(
    _debounce(async (val: string) => {
      setState((prev) => ({ ...prev, searching: true }));
      try {
        const result = await searchUser(val);
        if (result.data) {
          setState((prev) => ({
            ...prev,
            user: result.data,
            identityMessage: "",
          }));
        } else {
          setState((prev) => ({
            ...prev,
            user: undefined,
            identityMessage: result.message,
          }));
        }
      } catch (error) {
      } finally {
        setState((prev) => ({ ...prev, searching: false }));
      }
    }, 700)
  ).current;

  React.useEffect(() => {
    return () => {
      debouchSearchUser.cancel();
    };
  }, [debouchSearchUser]);

  const handleAmountChange = (
    ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const val = ev.target.value
    const value = parseFloat(!val ? "0" : val)
    setState((prev) => ({
      ...prev,
      [ev.target.name]: value,
      totalAmount: value + parseFloat((0.5 * value).toFixed(2)),
    }));
  };

  const handleIdentityChange = (
    ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const val = ev.target.value;
    setState((prev) => ({
      ...prev,
      identityMessage: "",
      [ev.target.name]: val,
    }));
    if (val && val.length > 2) {
      debouchSearchUser(ev.target.value);
    } else {
      setState((prev) => ({ ...prev, user: undefined }));
    }
  };

  const handleSubmit = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const zodResult = validateZodInput(
        {
          senderId: user.id,
          recipientId: String(state.user?.id),
          amount: state.amount,
        },
        TransferZodSchema
      );
      const zodData = zodResult.data;
      if (!zodData) return toast.warn(zodResult.message);
      if (zodData.amount < 100)
        return toast.warn("Minimum transfer amount is 100 Coins");
      if (zodData.recipientId === zodData.senderId)
        return toast.warn("You can't transfer coins to yourself");
      const result = await transferCoins(zodData);
      if (!result.data) return toast.error(result.message);
      onCompleted();
      toast.success(result.message);
      setState((prev) => ({
        ...prev,
        user: undefined,
        identity: "",
        amount: 0,
        totalAmount: 0,
      }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <React.Fragment>
      <Dialog
        // fullScreen={fullScreen}
        maxWidth={"md"}
        open={isOpen}
        onClose={toggle}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle
          sx={{ textAlign: "center" }}
          component={"p"}
          id="responsive-dialog-title"
        >
          Transfer Coins
        </DialogTitle>
        <DialogContent>
          {/* <DialogContentText sx={{py: 1}} component={"p"}>Enter details below</DialogContentText> */}
          <Box
            component="form"
            sx={{ "& .MuiTextField-root": { py: 1, mt: 1 } }}
            noValidate
            autoComplete="off"
          >
            <FormControl fullWidth>
              <TextField
                fullWidth
                value={state.amount}
                id="outlined-number"
                label="Amount"
                type="number"
                placeholder="Enter amount"
                name="amount"
                onChange={(ev) => handleAmountChange(ev)}
              />
            </FormControl>
            <Stack direction={"row"} sx={{ alignItems: "center", justifyContent: "flex-end" }} spacing={1}>
                <Typography variant="caption" component={"p"}>
                  Balance:
                </Typography>
                <Typography sx={{ fontWeight: "bold", fontFamily: "PlayFair" }} variant="caption" component={"p"}>
                    {formatNumberWithCommas(coinBalance - state.totalAmount)}
                </Typography>
              </Stack>

            <FormControl fullWidth>
              <TextField
                fullWidth
                required
                value={state.identity}
                id="outlined-required"
                label="User ID | Username | Email"
                placeholder="Enter User ID | Username | Email"
                name="identity"
                onChange={(ev) => handleIdentityChange(ev)}
                helperText={
                  <Typography variant="caption">
                    {state.identityMessage}
                  </Typography>
                }
              />
            </FormControl>
            <Box sx={{ position: "relative" }}>
              <Box sx={{ position: "absolute", right: 10 }}>
                {state.searching && (
                  <CircularProgress color="warning" size={12} />
                )}
              </Box>
            </Box>
            <Box>
              {state.user && (
                <Box>
                  <Stack
                    sx={{ alignItems: "center" }}
                    spacing={1}
                    direction={"row"}
                  >
                    <Avatar
                      src={state.user.avatar}
                      sx={{ height: 30, width: 30 }}
                    />
                    <Box>
                      <Stack direction={"row"}>
                        <Typography variant="caption">
                          {state.user.name}
                        </Typography>
                        <Typography variant="caption">
                          @{state.user.username}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              )}
            </Box>
            <Divider />

            <Box>
              <Stack direction="row" spacing={1}>
              <Stack
                direction={"row"}
                spacing={0.5}
                sx={{ alignItems: "center" }}
              >
                <Typography
                  sx={{ fontFamily: "PlayFair", fontStyle: "italic" }}
                  variant="subtitle2"
                >
                  Fee:{" "}
                </Typography>
                <Typography
                  sx={{ fontFamily: "PlayFair", fontStyle: "italic" }}
                  variant="caption"
                >
                  {0.5 * state.amount}
                </Typography>
              </Stack>
              <Stack
                direction={"row"}
                spacing={0.5}
                sx={{ alignItems: "center" }}
              >
                <Typography
                  sx={{ fontFamily: "PlayFair", fontStyle: "italic" }}
                  variant="subtitle2"
                >
                  Total:{" "}
                </Typography>
                <Typography
                  sx={{ fontFamily: "PlayFair", fontStyle: "italic" }}
                  variant="caption"
                >
                  {state.totalAmount}
                </Typography>
              </Stack>
              </Stack>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Button color="error" autoFocus onClick={toggle}>
            Close
          </Button>
          <Button
            disabled={!state.user || !state.amount}
            color="info"
            onClick={(ev) => handleSubmit(ev)}
            loading={state.loading}
            autoFocus
            endIcon={<SendOutlined />}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
