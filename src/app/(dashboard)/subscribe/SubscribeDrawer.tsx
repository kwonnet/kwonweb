"use client";
import {
  TxnCurrencyEnum,
  CryptoAddress,
  CryptoName,
  PlanTypeEnum,
  SubscriptionPlan,
  TxnGatewayEnum,
  TxnSourceEnum,
  PaymentSubscriptionOptions,
} from "@/types";
import {
  Box,
  Container,
  Typography,
  IconButton,
  SwipeableDrawer,
} from "@mui/material";
import React, { useState } from "react";
import { Close } from "@mui/icons-material";
import Link from "next/link";
import { genUniqueRef, getErrorMessage } from "@/utils";
// import {
//   useTonAddress,
//   useTonConnectModal,
//   useTonConnectUI,
// } from "@tonconnect/ui-react";
import { useUserCoinsWallet } from "@/lib/swrHooks";
// import { openInvoice, openLink } from "@telegram-apps/sdk-react";
import { toast } from "react-toastify";
// import { Address, Cell, toNano } from "@ton/ton";
import {
  genTmaSubscriptionInvoice,
  subscribePremium,
} from "@/lib/subscriptions";
import { useAuthSession } from "@/hooks";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import SubscriptionItem from "./SubscriptionItem";
import { useRouter } from "next/navigation";
import { getFlwPaymentLink } from "@/lib/payments";
import { getFlutterWaveSubPlanConfig } from "@/utils/payment";
import { useNotifications } from "@toolpad/core";

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

const SubscribeDrawer = ({
  isOpen,
  toggleDrawer,
  plan,
  tonRate,
  cryptoAddreses,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  plan: SubscriptionPlan;
  tonRate: number;
  cryptoAddreses: CryptoAddress[];
}) => {
  const [state, setState] = useState({
    isRecurring: true,
    planType: PlanTypeEnum.YEARLY,
    isLoading: false,
    amount: parseFloat((plan.price * (1 - plan.discount) * 12).toFixed(2)),
    isPremium: false,
  });

  const notif = useNotifications()

  const router = useRouter();

  const tonAddress = cryptoAddreses.find(
    (address) => address.name === CryptoName.TON
  );

  const isTonAddress = !!tonAddress;

  // ton connect ui
  // const [tonConnectUI] = useTonConnectUI();

  // const { open: openTonConnectModal } = useTonConnectModal();

  // const userTonAddress = useTonAddress();

  // get auth token

  const { user, token } = useAuthSession();
  // get user wallet

  const { data: userWallet } = useUserCoinsWallet(token);

  const calculateAmount = (params: {
    planType: PlanTypeEnum;
    planId: string;
    tierId?: string;
  }) => {
    if (!params.tierId) {
      return params.planType === PlanTypeEnum.YEARLY
        ? parseFloat((plan.price * (1 - plan.discount) * 12).toFixed(2))
        : plan.price;
    }
    const tier = plan.tier.find((i) => i.id === params.tierId);

    const tierPrice = tier?.price ?? 0;

    return params.planType === PlanTypeEnum.YEARLY
      ? parseFloat((tierPrice * (1 - plan.discount) * 12).toFixed(2))
      : tierPrice;
  };

  const handlePlanSelection = (params: {
    planType: PlanTypeEnum;
    planId: string;
    tierId?: string;
  }) => {
    setState((prev) => ({
      ...prev,
      planType: params.planType,
      amount: calculateAmount(params),
    }));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, isRecurring: event.target.checked }));
  };

  const handleFlwPurchase = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    item: PaymentSubscriptionOptions
  ) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const config = getFlutterWaveSubPlanConfig(user, {
        ...item,
        isRecurring: state.isRecurring,
        planType: state.planType,
      });
      const link = await getFlwPaymentLink(config, token);
      window.open(link, '_blank');
      // openLink(link);
      // close drawer
      toggleDrawer(ev, false);
      setTimeout(() => {
        router.push("/premium");
      }, 7000);
    } catch (error: any) {
      notif.show(getErrorMessage(error), {severity: "error", autoHideDuration: 3000});
    } finally {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        selectedId: undefined,
      }));
    }
  };

  // const handleTmaPurchase = async (
  //   ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  //   item: PaymentSubscriptionOptions
  // ) => {
  //   ev.preventDefault()
  //     setState((prev) => ({ ...prev, selectedId: item.tierId ? item.tierId : item.planId, isLoading: true }));
  //     try {
  //       const botTxnRef = genUniqueRef();
  //       // get invoice
  //       const link = await genTmaSubscriptionInvoice({
  //         planId: item.planId,
  //         tierId: item.tierId,
  //         gateway: item.gateway,
  //         amount: item.amount,
  //         botTxnRef,
  //         planType: state.planType,
  //         currency: item.currency,
  //         isRecurring: state.isRecurring,
  //         planName: item.planName,
  //       }, token);
  //       const slug = link.split("https://t.me/$")[1];
  //       if (openInvoice.isAvailable()) {
  //         console.log("Open Invoice available");
  //         const status = await openInvoice(slug);
  //         console.log("Invoice initiated", status);
  //         if (status === "success" || status === "paid") {
  //           const result = await subscribePremium(
  //             {
  //               planId: item.planId,
  //               amount: item.amount,
  //               currency: item.currency,
  //               planType: state.planType,
  //               isRecurring: state.isRecurring,
  //               gateway: item.gateway,
  //               source: item.source,
  //               planName: item.planName,
  //               meta: {
  //                 price: item.price,
  //                 discount: item.discount,
  //                 tierId: item.tierId,
  //                 amount: item.amount,
  //                 botTxnRef,
  //                 planType: state.planType,
  //                 currency: item.currency
  //               },
  //             },
  //             token
  //           );
  //           // close drawer
  //           toggleDrawer(ev, false);
  //           if (!result.data) return toast.error(result.message);
  //           toast.success(result.message);
  //           router.push("/premium")
  //         }
  //         else{
  //           toast.warn(
  //             "Payment failed, please choose another gateway & try again"
  //           );
  //         }
  //       } else {

  //         toast.warn(
  //           "Your telegram version does not support making payment or purchasing stars in mini app. Please upgrade to the latest version and try again. You can purchase coins using our telegram bot @torazone too. Check it out!"
  //         );
  //       }
  //     } catch (error: any) {
  //       console.log("Invoice initiated", error);
  //       toast.error(getErrorMessage(error));
  //     } finally {
  //       setState((prev) => ({
  //         ...prev,
  //         isLoading: false,
  //         selectedId: undefined,
  //       }));
  //     }
  //   };

  // const handleTonPurchase = async (
  //   ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  //   item: PaymentSubscriptionOptions
  // ) => {
  //   ev.preventDefault();
  //   try {
  //     // check if app wallet address is available
  //     if (!tonAddress)
  //       return toast.info(
  //         "Sorry, this payment gateway is not currently available, please try another!"
  //       );
  //     // check tonConnectUI is connected
  //     if (!tonConnectUI.connected) {
  //       return openTonConnectModal();
  //     }
  //     setState((prev) => ({ ...prev, isLoading: true }));
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
  //             amount: toNano(item.amount).toString(),
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
  //     const result = await subscribePremium(
  //       {
  //         planId: item.planId,
  //         amount: item.amount,
  //         currency: item.currency,
  //         planType: state.planType,
  //         isRecurring: state.isRecurring,
  //         gateway: item.gateway,
  //         source: item.source,
  //         planName: item.planName,
  //         meta: {
  //           from: userTonAddress,
  //           to: tonAddress.address,
  //           extHash,
  //           price: item.price,
  //           discount: item.discount,
  //           tierId: item.tierId,
  //         },
  //       },
  //       token
  //     );
  //     if (!result.data) return toast.error(result.message);

  //     toast.success(result.message);
  //     // close drawer
  //     toggleDrawer(ev, false);
  //     // refresh user auth
  //     // mutate();
  //     router.push("/premium");
  //   } catch (error: any) {
  //     console.log("Subscription failed ", error?.message);
  //     console.log(error);
  //   } finally {
  //     setState((prev) => ({ ...prev, isLoading: false }));
  //   }
  // };

  const handleWalletPurchase = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    item: PaymentSubscriptionOptions
  ) => {
    ev.preventDefault();
    if (!userWallet)
      return toast.warn(
        "Unable to retrieve your wallet. Please try again later"
      );

    if (userWallet.isLocked)
      return toast.warn("User wallet not available at the moment");

    if (userWallet.credit < item.amount)
      return toast.warn(
        "Insufficient balance to pay for this package, please try another one!"
      );

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await subscribePremium(
        {
          planId: item.planId,
          amount: item.amount,
          currency: item.currency,
          planType: state.planType,
          isRecurring: state.isRecurring,
          gateway: item.gateway,
          source: item.source,
          planName: item.planName,
          meta: {
            price: item.price,
            discount: item.discount,
            tierId: item.tierId,
          },
        },
        token
      );

      if (!result.data) return toast.error(result.message);

      toast.success(result.message);
      // close drawer
      toggleDrawer(ev, false);
      // refresh user auth
      // mutate();
      // show user plan
      router.push("/premium");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const [value, setValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const open = React.useMemo(() => isOpen, [isOpen]);

  const isTier = plan.tier.length > 0;

  const isUSD = user?.country?.iso3 !== "NGA";
  const itemCurrency = isUSD ? "$" : "₦"
  const itemPrice = !isUSD ? plan.ngnPrice : plan.price;

  return (
    <div>
      <React.Fragment>
        <SwipeableDrawer
          anchor={"bottom"}
          open={open}
          onClose={(ev) => toggleDrawer(ev, false)}
          onOpen={(ev) => {}}
          slotProps={{
            paper: {
              sx: {
                top: { lg: "10%", md: "10%", sm: "30%", xs: "30%" },
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                zIndex: 999,
                overflow: "auto",
                width: { lg: 600, md: 600, sm: "100%", width: "100%" },
                maxWidth: "100%",
                margin: "0 auto",
              },
            },
          }}
        >
          <Box role="presentation">
            <Box sx={{ position: "relative" }}>
              <Box sx={{ position: "absolute", right: 5 }}>
                <IconButton
                  color="inherit"
                  onClick={(ev) => toggleDrawer(ev, false)}
                >
                  <Close />
                </IconButton>
              </Box>
            </Box>
            <Container
              maxWidth="xl"
              sx={{
                // mt: 1,
                pb: 2,
                // position: "relative",
                // height: "100vh",
                // overflowY: "auto",
              }}
            >
              <Typography variant="h4" sx={{ fontFamily: "PlayFair", pt: 0 }}>
                {plan.name} Plan
              </Typography>
              {!isTier ? (
                <Box>
                  <SubscriptionItem
                    price={plan.price}
                    ngnPrice={plan.ngnPrice}
                    discount={plan.discount}
                    isLoading={state.isLoading}
                    isRecurring={state.isRecurring}
                    tonRate={tonRate}
                    handleRecurringChange={handleChange}
                    handleTonPurchase={() => {}}
                    handleWalletPurchase={handleWalletPurchase}
                    handleTmaPurchase={() => {}}
                    handleFlwPurchase={handleFlwPurchase}
                    selectedPlanType={state.planType}
                    handlePlanSelection={handlePlanSelection}
                    planId={plan.id}
                    planName={plan.name}
                    metadata={plan.metadata}
                  />
                </Box>
              ) : (
                <Box>
                  <Box sx={{ bgcolor: "background.paper" }}>
                    <Tabs
                      value={value}
                      onChange={handleTabChange}
                      indicatorColor="secondary"
                      textColor="inherit"
                      variant="scrollable"
                      scrollButtons="auto"
                      aria-label="Subscription plan tiers"
                      centered={true}
                    >
                      {plan.tier.map((tier) => (
                        <Tab
                          key={tier.id}
                          label={tier.name}
                          {...a11yProps(0)}
                        />
                      ))}
                    </Tabs>
                  </Box>
                  {plan.tier.map((tier, index) =>{
                    return (
                    <TabPanel key={tier.id} value={value} index={index}>
                      <Box>
                        <SubscriptionItem
                          price={tier.price}
                          ngnPrice={tier.ngnPrice}
                          discount={plan.discount}
                          isLoading={state.isLoading}
                          isRecurring={state.isRecurring}
                          tonRate={tonRate}
                          handleRecurringChange={handleChange}
                          handleTonPurchase={() => {}}
                          handleWalletPurchase={handleWalletPurchase}
                          handleTmaPurchase={() => {}}
                          handleFlwPurchase={handleFlwPurchase}
                          selectedPlanType={state.planType}
                          handlePlanSelection={handlePlanSelection}
                          planId={plan.id}
                          tierId={tier.id}
                          planName={`${plan.name} ~ ${tier.name}`}
                          metadata={plan.metadata}
                        />
                      </Box>
                    </TabPanel>
                  )})}
                </Box>
              )}
              <Typography mt={2} variant="body2">
                By subscribing, you agree to our{" "}
                <Link href={"/purchaser-terms-service"}>
                  Purchaser Terms of Service
                </Link>
                .{" "}
                {state.isRecurring
                  ? "Your subscription will automatically renew on a monthly or yearly basis, depending on the plan you choose. You can cancel at any time."
                  : "You'll have to manually renew your subscription when it expires."}
              </Typography>
            </Container>
          </Box>
        </SwipeableDrawer>
      </React.Fragment>
    </div>
  );
};
export default SubscribeDrawer;
