import { useAuthSession } from "@/hooks";
import {
  PaymentSubscriptionOptions,
  PlanTypeEnum,
  SubFlwPaymentPlan,
  TxnCurrencyEnum,
  TxnGatewayEnum,
  TxnSourceEnum,
} from "@/types";
import {
  formatNumberWithCommas,
  get_coins_rate,
  get_usd_stars_rate,
  get_usd_ton_rate,
  get_usd_tzx_rate,
} from "@/utils";
import {
  Box,
  CardMedia,
  Chip,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  Typography,
  Button
} from "@mui/material";
import React from "react";

const SubscriptionItem = ({
  price,
  discount,
  ngnPrice,
  isRecurring,
  handleRecurringChange,
  isLoading,
  handleWalletPurchase,
  handleTonPurchase,
  handleTmaPurchase,
  handleFlwPurchase,
  tonRate,
  selectedPlanType,
  handlePlanSelection,
  planId,
  tierId,
  planName,
  metadata,
}: {
  price: number;
  discount: number;
  ngnPrice: number;
  isRecurring: boolean;
  isLoading: boolean;
  tonRate: number;
  planId: string;
  tierId?: string;
  planName: string;
  selectedPlanType: PlanTypeEnum;
  metadata?: { flw: SubFlwPaymentPlan[] } | null;
  handleRecurringChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => void;
  handleWalletPurchase: (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    params: PaymentSubscriptionOptions
  ) => void;
  handleTonPurchase: (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    params: PaymentSubscriptionOptions
  ) => void;
  handleTmaPurchase: (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    item: PaymentSubscriptionOptions
  ) => void;

  handleFlwPurchase: (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    item: PaymentSubscriptionOptions
  ) => void;
  handlePlanSelection: (arg: {
    planType: PlanTypeEnum;
    planId: string;
    tierId?: string;
  }) => void;
}) => {

  const { user, token } = useAuthSession();

  const isUSD = user?.country?.iso3 !== "NGA";

  const ngnCurrency =  "₦";

  const usdCurrency = "$"

  const itemCurrency = isUSD ? usdCurrency : ngnCurrency

  const itemPrice = isUSD ? price : ngnPrice;

  const getBorder = (planType: PlanTypeEnum, color: string) => {
    return selectedPlanType === planType ? `1px solid ${color}` : "none";
  };

  const getElevation = (planType: PlanTypeEnum) => {
    return selectedPlanType === planType ? 5 : 3;
  };
  const calculateAmount = (amount: number, isRounded: boolean = false) => {
    const amt =  selectedPlanType === PlanTypeEnum.YEARLY
      ? parseFloat((amount * (1 - discount) * 12).toFixed(2))
      : amount;
      return isRounded ? Math.round(amt) : amt
  };
  return (
    <Box>
      <Paper
        onClick={() =>
          handlePlanSelection({ planType: PlanTypeEnum.YEARLY, tierId, planId })
        }
        elevation={getElevation(PlanTypeEnum.YEARLY)}
        sx={{
          p: 2,
          cursor: "pointer",
          border: (theme) =>
            getBorder(PlanTypeEnum.YEARLY, theme.vars.palette.info.light),
        }}
      >
        <Stack spacing={1} direction={"row"} sx={{ alignItems: "center" }}>
          <Typography sx={{ fontFamily: "PlayFair" }} variant="subtitle1">
            Annual Plan{" "}
          </Typography>
          <Chip size="small" color="info" label={`Save ${discount * 100}%`} />
        </Stack>
        <Typography sx={{ fontFamily: "PlayFair" }} variant="h6">
          {itemCurrency}{formatNumberWithCommas(itemPrice * (1 - discount))} / month{" "}
        </Typography>
        <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
          {itemCurrency}{formatNumberWithCommas(itemPrice * (1 - discount) * 12)} per year, billed annually{" "}
        </Typography>
      </Paper>
      <Paper
        onClick={() =>
          handlePlanSelection({
            planType: PlanTypeEnum.MONTHLY,
            tierId,
            planId,
          })
        }
        elevation={getElevation(PlanTypeEnum.MONTHLY)}
        sx={{
          p: 2,
          cursor: "pointer",
          mt: 1,
          border: (theme) =>
            getBorder(PlanTypeEnum.MONTHLY, theme.vars.palette.info.light),
        }}
      >
        <Stack spacing={1} direction={"row"} sx={{ alignItems: "center" }}>
          <Typography sx={{ fontFamily: "PlayFair" }} variant="subtitle1">
            Monthly Plan{" "}
          </Typography>
        </Stack>
        <Typography sx={{ fontFamily: "PlayFair" }} variant="h6">
          {itemCurrency}{formatNumberWithCommas(itemPrice)} / month{" "}
        </Typography>
        <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
          {itemCurrency}{formatNumberWithCommas(itemPrice * 12)} per year, billed monthly{" "}
        </Typography>
      </Paper>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <FormControlLabel
          control={
            <Switch
              checked={isRecurring}
              onChange={handleRecurringChange}
              color="warning"
              inputProps={{ "aria-label": "controlled" }}
            />
          }
          label="Recurring"
        />
      </Box>
      <Typography
        sx={{ fontFamily: "PlayFair", py: 1, textAlign: "center" }}
        variant="h5"
      >
        Subscribe & Pay{" "}
      </Typography>
      <Box>
        <Grid container spacing={2}>
          <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={(ev) =>
                handleTonPurchase(ev, {
                  amount: get_usd_ton_rate(calculateAmount(price), tonRate),
                  price,
                  discount,
                  planId,
                  tierId,
                  currency: TxnCurrencyEnum.TON,
                  gateway: TxnGatewayEnum.CRYPTO,
                  source: TxnSourceEnum.CRYPTO,
                  planName,
                })
              }
              disabled={isLoading}
              loading={isLoading}
              sx={{
                p: 2,
                width: "100%",
              }}
            >
              {formatNumberWithCommas(
                get_usd_ton_rate(calculateAmount(price), tonRate)
              )}{" "}
              TON
            </Button>
          </Grid>

          <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={(ev) =>
                handleWalletPurchase(ev, {
                  amount: get_coins_rate(calculateAmount(itemPrice), isUSD),
                  price,
                  discount,
                  planId,
                  tierId,
                  currency: TxnCurrencyEnum.COINS,
                  gateway: TxnGatewayEnum.VIRTUAL,
                  source: TxnSourceEnum.COINS,
                  planName,
                })
              }
              disabled={isLoading}
              loading={isLoading}
              sx={{
                p: 2,
                width: "100%",
              }}
            >
              {formatNumberWithCommas(get_coins_rate(calculateAmount(itemPrice), isUSD))} {TxnCurrencyEnum.COINS}
            </Button>
          </Grid>

          <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={(ev) =>
                handleFlwPurchase(ev, {
                  amount: calculateAmount(itemPrice),
                  currency: isUSD ? TxnCurrencyEnum.USD : TxnCurrencyEnum.NGN,
                  price,
                  discount,
                  planId,
                  tierId,
                  gateway: TxnGatewayEnum.FLUTTERWAVE,
                  source: TxnSourceEnum.FIAT,
                  planName,
                  metadata
                })
              }
              disabled={isLoading}
              loading={isLoading}
              sx={{
                p: 2,
                width: "100%",
              }}
              endIcon={
                <CardMedia
                  image="/flutterwave2.png"
                  sx={{ height: 20, width: 20 }}
                />
              }
            >
              Pay {itemCurrency}{formatNumberWithCommas(calculateAmount(itemPrice))}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default SubscriptionItem;
