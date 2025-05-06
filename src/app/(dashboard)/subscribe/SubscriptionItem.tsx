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
  const getBorder = (planType: PlanTypeEnum, color: string) => {
    return selectedPlanType === planType ? `1px solid ${color}` : "none";
  };

  const getElevation = (planType: PlanTypeEnum) => {
    return selectedPlanType === planType ? 5 : 3;
  };
  const calculateAmount = (isRounded: boolean = false) => {
    const amt =  selectedPlanType === PlanTypeEnum.YEARLY
      ? parseFloat((price * (1 - discount) * 12).toFixed(2))
      : price;
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
          ${(price * (1 - discount)).toFixed(2)} / month{" "}
        </Typography>
        <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
          ${(price * (1 - discount) * 12).toFixed(2)} per year, billed annually{" "}
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
          ${price.toFixed(2)} / month{" "}
        </Typography>
        <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
          ${(price * 12).toFixed(2)} per year, billed monthly{" "}
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
          {Math.round(get_usd_stars_rate(calculateAmount(true))) <= 2500 && <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={(ev) =>
                handleTmaPurchase(ev, {
                  amount: Math.round(get_usd_stars_rate(calculateAmount(true))),
                  currency: TxnCurrencyEnum.XTR,
                  price,
                  discount,
                  planId,
                  tierId,
                  gateway: TxnGatewayEnum.STARS,
                  source: TxnSourceEnum.STARS,
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
              {formatNumberWithCommas(Math.round(get_usd_stars_rate(calculateAmount(true))))}{" "}
              ⭐️
            </Button>
          </Grid>}

          <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={(ev) =>
                handleTonPurchase(ev, {
                  amount: get_usd_ton_rate(calculateAmount(), tonRate),
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
                get_usd_ton_rate(calculateAmount(), tonRate)
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
                  amount: get_usd_tzx_rate(calculateAmount()),
                  price,
                  discount,
                  planId,
                  tierId,
                  currency: TxnCurrencyEnum.TZX,
                  gateway: TxnGatewayEnum.VIRTUAL,
                  source: TxnSourceEnum.CREDIT,
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
              {formatNumberWithCommas(get_usd_tzx_rate(calculateAmount()))} TZX
            </Button>
          </Grid>

          <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={(ev) =>
                handleTmaPurchase(ev, {
                  amount: calculateAmount(),
                  currency: TxnCurrencyEnum.USD,
                  price,
                  discount,
                  planId,
                  tierId,
                  gateway: TxnGatewayEnum.SMART_GLOCAL,
                  source: TxnSourceEnum.FIAT,
                  planName,
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
                  image="/smart-glocal.png"
                  sx={{ height: 20, width: 20 }}
                />
              }
            >
              Pay ${formatNumberWithCommas(calculateAmount())}
            </Button>
          </Grid>

          {/* <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={(ev) =>
                handleTmaPurchase(ev, {
                  amount: calculateAmount(),
                  currency: TxnCurrencyEnum.USD,
                  price,
                  discount,
                  planId,
                  tierId,
                  gateway: TxnGatewayEnum.UNLIMINT,
                  source: TxnSourceEnum.FIAT,
                  planName,
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
                  image="/unlimint.png"
                  sx={{ height: 20, width: 20 }}
                />
              }
            >
              Pay ${formatNumberWithCommas(calculateAmount())}
            </Button>
          </Grid> */}

          <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={(ev) =>
                handleFlwPurchase(ev, {
                  amount: calculateAmount(),
                  currency: TxnCurrencyEnum.USD,
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
              Pay ${formatNumberWithCommas(calculateAmount())}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default SubscriptionItem;
