"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Typography,
  Card,
  CardContent,
  Stack,
  Box,
  Grid,
  CardMedia,
  Paper,
} from "@mui/material";
// import { Button } from "@mui/lab";
import { toast } from "react-toastify";
import {
  CoinPackage,
  TxnCurrencyEnum,
  CryptoAddress,
  CryptoName,
  TxnGatewayEnum,
  TxnSourceEnum,
} from "@/types";
// import {
//   useTonConnectModal,
//   useTonConnectUI,
//   TransactionSignedEvent,
//   useTonAddress,
// } from "@tonconnect/ui-react";
import {
  formatNumber,
  formatNumberWithCommas,
  genUniqueRef,
  get_tzx_stars_rate,
  get_tzx_usd_rate,
  getCurrent_ton_usd_rate,
  getErrorMessage,
  getTONRate,
} from "@/utils";
// import { CoinsSvgIcon } from "../svg";
import { Fade } from "react-awesome-reveal";
// import { axiosAPI } from "@/config";
// import { openInvoice, openLink } from "@telegram-apps/sdk-react";
// import { Address, Cell, fromNano, toNano } from "@ton/ton";
import { useUserCoinsWallet } from "@/lib/swrHooks";
// import { useAuthContext } from "@/context/AuthContext";
import { purchaseCoins } from "@/lib/coins";
import { getFlutterWaveCoinConfig } from "@/utils/payment";
import Link from "next/link";
import { useAuthSession } from "@/hooks";
import { axiosAPI } from "@/config/axios";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { useNotifications } from "@toolpad/core";

const BuyCoinsContainer = ({
  data,
  currentTonRate,
  toggleDrawer,
  isPage,
}: {
  data: { packages: CoinPackage[]; addresses: CryptoAddress[] };
  currentTonRate: number;
  toggleDrawer?: (ev: any, open: boolean) => void;
  isPage?: boolean
}) => {
  const [state, setState] = useState<{
    isLoading: boolean;
    selectedId?: string;
  }>({
    selectedId: undefined,
    isLoading: false,
  });

  const { addresses, packages } = data;

  const tonAddress = addresses.find(
    (address) => address.name === CryptoName.TON
  );

  const isTonAddress = !!tonAddress;

  // ton connect ui
  // const [tonConnectUI] = useTonConnectUI();

  // const { open: openTonConnectModal } = useTonConnectModal();

  // const userTonAddress = useTonAddress();

  // get auth token

  const { token, user } = useAuthSession();

  // get user wallet

  console.log("user", user);

  const { data: userWallet } = useUserCoinsWallet(token);

  const notif = useNotifications();

  // const handleTmaPurchase = async (item: {
  //   id: string;
  //   currency: TxnCurrencyEnum;
  //   gateway: TxnGatewayEnum;
  //   source: TxnSourceEnum;
  //   amount: number;
  // }) => {
  //   setState((prev) => ({ ...prev, selectedId: item.id, isLoading: true }));
  //   try {
  //     const botTxnRef = genUniqueRef();
  //     // get invoice
  //     axiosAPI.accessToken = token;
  //     const result = await axiosAPI.post("/coins/invoices", {
  //       id: item.id,
  //       botTxnRef,
  //       gateway: item.gateway,
  //     });
  //     const url = result.data;
  //     console.log(url);
  //     const slug = url.split("https://t.me/$")[1];
  //     if (openInvoice.isAvailable()) {
  //       console.log("Open Invoice available");
  //       const status = await openInvoice(slug);
  //       console.log("Invoice initiated", status);
  //       if (status === "success" || status === "paid") {
  //         const result = await purchaseCoins(
  //           {
  //             packageId: item.id,
  //             currency: TxnCurrencyEnum.USD,
  //             meta: { ...item, status, botTxnRef },
  //           },
  //           token
  //         );
  //         if (result.data) return toast.success(result.message);
  //         toast.error(result.message);
  //       }
  //       else{
  //         toast.warn(
  //           "Payment failed, please choose another gateway & try again"
  //         );
  //       }
  //     } else {

  //       toast.warn(
  //         "Your telegram version does not support making payment or purchasing stars in mini app. Please upgrade to the latest version and try again. You can purchase coins using our telegram bot @torazone too. Check it out!"
  //       );
  //     }
  //   } catch (error: any) {
  //     console.log("Invoice initiated", error);
  //     toast.error(getErrorMessage(error));
  //   } finally {
  //     setState((prev) => ({
  //       ...prev,
  //       isLoading: false,
  //       selectedId: undefined,
  //     }));
  //   }
  // };

  // const handleTonPurchase = async (
  //   ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  //   item: CoinPackage
  // ) => {
  //   try {
  //     setState((prev) => ({ ...prev, selectedId: item.id, isLoading: true }));
  //     // check if app wallet address is available
  //     if (!tonAddress)
  //       return toast.info(
  //         "Sorry, this payment gateway is not currently available, please try another!"
  //       );
  //     // check tonConnectUI is connected
  //     if (!tonConnectUI.connected) {
  //       return openTonConnectModal();
  //     }
  //     // check TON USD rate
  //     const tonUsdRate = await getCurrent_ton_usd_rate();
  //     if (!tonUsdRate)
  //       return toast.info(
  //         "Error: Could not get current TON - USD rate. Try other payment method"
  //       );
  //     // get the actual amount
  //     const cryptoAmount = getTONRate(tonUsdRate, item.price);
  //     setState((prev) => ({ ...prev }));
  //     console.log("App tonAddress ", tonAddress);
  //     // close the coin list modal if any
  //     toggleDrawer && toggleDrawer(ev, false);
  //     // initiate payment
  //     const txn = await tonConnectUI.sendTransaction(
  //       {
  //         validUntil: Math.floor(Date.now() / 1000) + 60,
  //         messages: [
  //           {
  //             address: Address.parse(tonAddress.address).toRawString(),
  //             amount: toNano(cryptoAmount).toString(),
  //             // payload: `u=${user.id}&id=${item.id}&t=${timestamp}`,
  //           },
  //         ],
  //       },
  //       {
  //         modals: ["before", "success", "error"],
  //         notifications: ["before", "success", "error"],
  //       }
  //     );
  //     console.log("Purchase response: ", txn);
  //     const extHash = Cell.fromBase64(txn.boc).hash().toString("hex");
  //     const result = await purchaseCoins(
  //       {
  //         packageId: item.id,
  //         currency: TxnCurrencyEnum.TON,
  //         meta: {
  //           from: userTonAddress,
  //           to: tonAddress.address,
  //           amount: cryptoAmount,
  //           extHash,
  //           gateway: TxnGatewayEnum.CRYPTO,
  //           currency: TxnCurrencyEnum.TON,
  //           source: TxnSourceEnum.CRYPTO,
  //         },
  //       },
  //       token
  //     );
  //     if (result.data) return toast.success(result.message);
  //     toast.error(result.message);
  //   } catch (error: any) {
  //     toast.error(getErrorMessage(error));
  //   } finally {
  //     setState((prev) => ({
  //       ...prev,
  //       isLoading: false,
  //       selectedId: undefined,
  //     }));
  //   }
  // };

  const handleWalletPurchase = async (item: CoinPackage) => {
    if (!userWallet)
      return toast.warn(
        "Unable to retrieve your wallet. Please try again later"
      );

    if (userWallet.isLocked)
      return toast.warn("User wallet not available at the moment");

    if (userWallet.credit < item.price)
      return toast.warn(
        "Insufficient balance to pay for this package, please try another one!"
      );

    setState((prev) => ({ ...prev, isLoading: true, selectedId: item.id }));

    try {
      const result = await purchaseCoins(
        {
          packageId: item.id,
          currency: TxnCurrencyEnum.TZX,
          meta: {
            amount: item.price,
            gateway: TxnGatewayEnum.WALLET,
            currency: TxnCurrencyEnum.TZX,
            source: TxnSourceEnum.CREDIT,
          },
        },
        token
      );

      if (result.data) return toast.success(result.message);

      toast.error(result.message);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        selectedId: undefined,
      }));
    }
  };

  const handleFlwPurchase = async (item: CoinPackage, isUSD: boolean) => {
    setState((prev) => ({ ...prev, isLoading: true, selectedId: item.id }));
    const config = getFlutterWaveCoinConfig(user, item, isUSD);
    console.log("Flutterwave config: ", config);
    const handleFlutterPayment = useFlutterwave(config);
    handleFlutterPayment({
      callback: async (response) => {
        try {
          console.log(response);
          axiosAPI.accessToken = token;
          const result = await axiosAPI.post("/v1/payments/flw/verify", response);
          notif.show(result.data, {
            severity: "success",
            autoHideDuration: 5000,
          });
        } catch (error: any) {
          console.log("Flutterwave payment error: ", error);
          notif.show(getErrorMessage(error), {
            severity: "error",
            autoHideDuration: 5000,
          });
        } finally {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            selectedId: undefined,
          }));
        }
        closePaymentModal();
      },
      onClose: () => {
        setState((prev) => ({
            ...prev,
            isLoading: false,
            selectedId: undefined,
          }));
      },
    });
  };

  // useEffect(() => {
  //   window.addEventListener("transaction-sent-for-signature", (event) => {
  //     console.log("Transaction Initiated", event);
  //   });

  //   window.addEventListener("ton-connect-ui-transaction-signed", async (ev) => {
  //     try {
  //       const event = ev as Event & { details: TransactionSignedEvent };
  //       console.log("Transaction completed", ev);
  //       // const txnInfo = event.details
  //       // const message = txnInfo.messages[0]
  //       // const from = Address.parse(String(txnInfo.from)).toString({ bounceable: false})
  //       // const to = Address.parse(String(message.address)).toString({bounceable: false})
  //       // const amount = Number(fromNano(Number(message.amount) ))
  //       // const hash = txnInfo.signed_transaction.toString()
  //       // const meta = { from, to, hash, amount }
  //       // console.log("Transaction ", txnInfo.from)
  //       // // await axiosAPI.post("/purchase_status", state.txn);
  //       // const result = await purchaseCoins({coin: state.coin as CoinPackage, currency: TxnCurrencyEnum.TON, meta }, token );
  //       // if(result.data) return toast.success(result.message);
  //       // toast.error(result.message)
  //     } catch (error: any) {
  //       toast.error(error?.message);
  //     }
  //   });
  //   return () => {};
  // }, []);

  return (
    <Box>
      {/* <Box><Typography textAlign={"center"}>Coins Packages</Typography></Box> */}
      <Grid container spacing={3}>
        <Paper
          sx={{
            p: 1,
            border: (theme) => `1px solid ${theme.vars.palette.secondary.light}`,
          }}
        >
          <Typography variant="caption">
            By purchasing, you agree to the Terms of{" "}
            <Link href={"/purchaser-coins-terms-service"}>
              Purchase for Coins
            </Link>
            . By using any amount of coins purchased after 14 days, you
            acknowledge and confirm that you will no longer be eligible for a
            refund of this order.
          </Typography>
          <Typography variant="caption">
            You can demand for refund within 14 days from when this purchase is
            completed.
          </Typography>
          <Typography variant="caption">
            By continuing this purchase, you agree to our terms.
          </Typography>
        </Paper>
        {packages.map((item) => {
          const itemCurrency = user?.country?.iso3 === "NGA" ? "₦" : "$";
          const itemPrice = itemCurrency === "₦" ? item.ngnPrice : item.price;
          const itemBonus = itemCurrency === "₦" ? item.ngnBonus : item.bonus;
          const isUSD = user?.country?.iso3 !== "NGA";
          return (
            <Grid size={{ lg: isPage ? 4 : 6, md: isPage ? 4 : 6, sm: 12, xs: 12 }} key={item.id}>
              <Fade style={{ height: "100%" }}>
                <Card sx={{ height: "100%", width: "100%" }}>
                  <CardContent>
                    <Typography
                      sx={{
                        fontFamily: "PlayFair",
                        fontStyle: "italic",
                        textAlign: "center",
                      }}
                      variant="h4"
                    >
                      {item.name}
                    </Typography>
                    <Stack
                      direction={"row"}
                      sx={{ alignItems: "center", justifyContent: "center" }}
                    >
                      {/* <CoinsSvgIcon style={{ fontSize: 16 }} /> */}
                      <Typography
                        sx={{ fontFamily: "PlayFair" }}
                        variant="h6"
                      >{`${formatNumber(item.amount)} coins`}</Typography>
                    </Stack>

                    {itemBonus > 0 && (
                      <Stack
                        direction={"row"}
                        sx={{ alignItems: "center", justifyContent: "center" }}
                      >
                        {/* <CoinsSvgIcon style={{ fontSize: 12 }} /> */}
                        <Typography
                          sx={{ fontFamily: "PlayFair", fontStyle: "italic" }}
                          variant="caption"
                        >
                          {`+${formatNumber(itemBonus)} bonus`}
                        </Typography>
                      </Stack>
                    )}
                    {/* payment button */}
                    <Grid container spacing={3}>
                      {(isTonAddress && currentTonRate > 0) && (
                        <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="info"
                            // onClick={(ev) => handleTonPurchase(ev, item)}
                            disabled={state.isLoading}
                            loading={state.selectedId === item.id}
                            sx={{
                              p: { lg: 0.5, md: 0.5, sm: 0.5, xs: 0.5 },
                              fontSize: { lg: 12, md: 12, sm: 12, xs: 12 },
                              borderRadius: 1,
                              width: "100%",
                            }}
                            endIcon={
                              <CardMedia
                                image="/toncoin.png"
                                sx={{ height: 20, width: 20 }}
                              />
                            }
                          >
                            {formatNumber(
                              getTONRate(currentTonRate, item.price)
                            )}{" "}
                            TON
                          </Button>
                        </Grid>
                      )}

                      {(() => {
                        if (item.price > 1000 && isUSD) {
                          return <React.Fragment></React.Fragment>;
                        }
                        return (
                          <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
                            <Button
                              sx={{
                                p: { lg: 0.5, md: 0.5, sm: 0.5, xs: 0.5 },
                                fontSize: { lg: 12, md: 12, sm: 12, xs: 12 },
                                borderRadius: 1,
                              }}
                              onClick={(ev) => handleFlwPurchase(item, isUSD)}
                              variant="outlined"
                              size="small"
                              color="warning"
                              fullWidth
                              endIcon={
                                <CardMedia
                                  image="/flutterwave2.png"
                                  sx={{ height: 20, width: 20 }}
                                />
                              }
                              disabled={state.isLoading}
                              loading={state.selectedId === item.id}
                            >
                              Pay {itemCurrency}
                              {formatNumberWithCommas(itemPrice)}
                            </Button>
                          </Grid>
                        );
                      })()}
                    </Grid>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default BuyCoinsContainer;
