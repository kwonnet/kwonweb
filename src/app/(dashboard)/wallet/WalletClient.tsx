"use client";
import PageHeader from "@/components/common/PageHeader";
import { TransferModal, WithdrawalModal } from "@/components/modal";
import { WalletSkeleton } from "@/components/skeleton";
import { CoinsSvgIcon } from "@/components/svg";
import { useUserCoinsWallet } from "@/lib/swrHooks";
import { formatNumber, formatNumberWithCommas, getTONRate } from "@/utils";
import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
// import { TonConnectButton } from "@tonconnect/ui-react";
import Link from "next/link";
import React, { useState } from "react";
import TxnHistory from "./TxnHistory";
import { useAuthSession } from "@/hooks";

const WalletClient = ({tonRate}: { tonRate: number}) => {

  const [state, setState] = useState({
    isOpenTransfer: false, 
    isOpenWithdrawal: false,
    formatShortAmount: true, 
    formatShortBonus: true, 
    formatShortCredit: true,
    refreshHistory: false
  });

  const { token } = useAuthSession()

  const { data: wallet, isLoading, mutate} = useUserCoinsWallet(token)
  

  if(isLoading || !wallet) return <WalletSkeleton />

  const disableWithdraw = wallet.credit === 0 || wallet.isLocked

  const disableTransfer = wallet.coins < 100

  const toggleTransferModal = () => {
    setState(prev => ({...prev, isOpenTransfer: !prev.isOpenTransfer }))
  }

  const toggleWithdrawalModal = () => {
    setState(prev => ({...prev, isOpenWithdrawal: !prev.isOpenWithdrawal }))
  }

  const onCompleted = () => {
    mutate()
    setState(prev => ({...prev, refreshHistory: true }))
    setTimeout(() => {
      setState(prev => ({...prev, refreshHistory: false }))
    }, 1500);
  }

  const tonCreditBalance = getTONRate(tonRate + 1, wallet.credit)

  return (
    <Box>
      <Container maxWidth="xl">
      <PageHeader title="My Wallet" />
          <Box sx={{ clear: "right", pt: 0 }}>
            <Paper
              sx={[
                (theme) => ({
                  py: 2,
                  px: 4,
                  background: theme.vars.palette.gradient[100],
                  color: theme.vars.palette.gradient.contrastText,
                  ...theme.applyStyles("dark", {
                    background: theme.vars.palette.grey[900]
                  })
                }),
              ]}
            >
              <Stack justifyContent={"space-between"} direction={"row"}>
              <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
                Balance
              </Typography>
              <Button 
                href="/store" 
                LinkComponent={Link} 
                variant="outlined" 
                color="warning" sx={{ borderRadius: 30 }}
                size="small"
            >
              Buy Coins
            </Button>
              </Stack>
              {/* Coins  */}
              <Box sx={{ py: 1 }}>
                <Stack
                  direction={"row"}
                  sx={{ alignItems: "center", justifyContent: "space-between" }}
                  spacing={1}
                >
                  <Typography
                    variant="h5"
                    component={"h5"}
                    sx={{ fontFamily: "PlayFair", fontStyle: "italic" }}
                  >
                    Coins
                  </Typography>
                  <Stack direction={"row"} sx={{ alignItems: "center" }}>
                    <CoinsSvgIcon style={{ fontSize: 12 }} />
                    <Typography
                      sx={{ fontWeight: "bold", fontFamily: "PlayFair" }}
                      variant="h6"
                      onClick={() => setState(prev => ({...prev, formatShortAmount: !prev.formatShortAmount}))}
                    >
                     {state.formatShortAmount ? formatNumber(wallet.coins) : formatNumberWithCommas(wallet.coins)} 
                    </Typography>
                  </Stack>
                </Stack>
                <Box
                  sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
                >
                  <Stack spacing={2} direction={"row"}>
                  <Button
                    variant="outlined"
                    color={disableWithdraw ? "error" :"info"}
                    sx={{ borderRadius: 30 }}
                    disabled={disableWithdraw}
                    onClick={() => toggleWithdrawalModal()}
                  >
                    Withdraw
                  </Button>
                  <Button
                    variant="outlined"
                    color={disableTransfer ? "error" : "info"}
                    sx={{ borderRadius: 30 }}
                    disabled={disableTransfer}
                    onClick={() => toggleTransferModal()}
                  >
                    Transfer
                  </Button>
                  </Stack>
                </Box>
              </Box>
              <Divider
                variant="fullWidth"
                sx={{
                  border: (theme) => `1px solid ${theme.palette.tints[100]}`,
                }}
              />
                {/* Bonus section */}
              <Box sx={{ pb: 1 }}>
                <Stack
                  direction={"row"}
                  sx={{ alignItems: "center", justifyContent: "space-between" }}
                  spacing={1}
                >
                  <Typography
                    variant="h5"
                    component={"h5"}
                    sx={{ fontFamily: "PlayFair", fontStyle: "italic" }}
                  >
                    Bonus
                  </Typography>
                  <Stack direction={"row"} sx={{ alignItems: "center" }}>
                    <CoinsSvgIcon style={{ fontSize: 12 }} />
                    <Typography
                      sx={{ fontWeight: "bold", fontFamily: "PlayFair", cursor: "pointer" }}
                      variant="h6"
                      onClick={() => setState(prev => ({...prev, formatShortBonus: !prev.formatShortBonus}))}
                    >
                      {state.formatShortBonus ? formatNumber(wallet.bonus) : formatNumberWithCommas(wallet.bonus)}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Paper>
                {/* history section */}
            <Typography
              sx={{
                py: 1,
                textAlign: "center",
                fontWeight: "bold",
                fontFamily: "PlayFair",
              }}
              variant="h4"
            >
              Transaction History
            </Typography>
            <Box>
              <TxnHistory refreshHistory={state.refreshHistory} />
            </Box>
          </Box>
      </Container>
      <TransferModal 
        coinBalance={wallet.coins}
        toggle={toggleTransferModal} 
        isOpen={state.isOpenTransfer} 
        onCompleted={onCompleted} />
      <WithdrawalModal 
        creditBalance={wallet.credit}
        tonRate={tonRate}
        toggle={toggleWithdrawalModal} 
        isOpen={state.isOpenWithdrawal} 
        onCompleted={onCompleted} />
    </Box>
  );
};

export default WalletClient;
