"use client";
import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
  Box,
  FormControl,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { withdrawCoins } from "@/lib/coins";
import _debounce from "lodash/debounce";
import { SendOutlined } from "@mui/icons-material";
import { toast } from "react-toastify";
import {
  formatNumberWithCommas,
  getErrorMessage,
  getTONRate,
  getWithrawalTxnFee,
  validateZodInput,
} from "@/utils";
import { TransferZodSchema } from "@/schema/coins";
import { useAuthSession } from "@/hooks";


type LocalState = {
  userId: string;
  amount: number;
  totalAmount: number;
  loading: boolean;
};

export default function WithdrawalModal({
  isOpen,
  toggle,
  onCompleted,
  creditBalance,
  tonRate
}: {
  isOpen: boolean;
  toggle: () => void;
  onCompleted: () => void;
  creditBalance: number;
  tonRate: number;
}) {
  const [state, setState] = React.useState<LocalState>({
    userId: "",
    amount: 0,
    totalAmount: 0,
    loading: false,
  });

  const { token, user } = useAuthSession();

  const handleAmountChange = (
    ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const val = ev.target.value
    const value = parseFloat(!val ? "0" : val)
    setState((prev) => ({ 
      ...prev, 
      amount: value,
      totalAmount: value + getWithrawalTxnFee(value)
    }))
  };

  const handleSubmit = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const AmountSchema = TransferZodSchema.pick({ amount: true });
      const zodResult = validateZodInput(
        {
          amount: state.amount,
        },
        AmountSchema
      );
      const zodData = zodResult.data;
      if (!zodData) return toast.warn(zodResult.message);
      const result = await withdrawCoins(zodData, token);
      if (!result.data) return toast.error(result.message);
      onCompleted();
      toast.success(result.message);
      setState((prev) => ({ ...prev, amount: 0, totalAmount: 0 }));
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
          Withdraw Coins
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{ "& .MuiTextField-root": { py: 1, mt: 1 } }}
            noValidate
            autoComplete="off"
          >
            <FormControl fullWidth>
              <TextField
                fullWidth
                id="outlined-number"
                label="Amount"
                type="number"
                placeholder="Enter amount"
                name="amount"
                value={state.amount}
                onChange={(ev) => handleAmountChange(ev)}
              />
            </FormControl>
            <Stack direction={"row"} sx={{ alignItems: "center", justifyContent: "flex-end" }} spacing={1}>
              <Typography variant="caption" component={"p"}>
                Balance:
              </Typography>
              <Stack direction={"row"} spacing={1} sx={{alignItems: "center"}}>
                <Typography sx={{ fontWeight: "bold", fontFamily: "PlayFair" }} variant="caption" component={"p"}>
                  {formatNumberWithCommas(creditBalance - state.totalAmount)} TZX
                </Typography>
                <Typography>-</Typography>
                <Typography
                sx={{ fontWeight: "bold", fontFamily: "PlayFair" }}
                variant="caption"
              >
                {formatNumberWithCommas(getTONRate(tonRate + 1, (creditBalance - state.totalAmount)))} TON
              </Typography>
              </Stack>
            </Stack>

            <Box>
              <Stack direction="row" spacing={1}>
                <Stack
                  direction={"row"}
                  spacing={0.5}
                  sx={{ alignItems: "center", justifyContent: "center" }}
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
                    {getWithrawalTxnFee(state.amount)}
                  </Typography>
                </Stack>

                <Stack
                  direction={"row"}
                  spacing={0.5}
                  sx={{ alignItems: "center", justifyContent: "center" }}
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
                    {formatNumberWithCommas(state.totalAmount)} TZX
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
            disabled={!state.amount || state.totalAmount > creditBalance }
            color="info"
            onClick={(ev) => handleSubmit(ev)}
            loading={state.loading}
            autoFocus
            endIcon={<SendOutlined />}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
