import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useGameSocketIoContext } from "@/context/GameSocketIoContext";
const GameWallet = () => {
  
  const {wallet} = useGameSocketIoContext()

  return (
    <Card
      sx={[(theme) => ({
        // maxWidth: 400,
        background: theme.vars.palette.gradient.E900,
        color: "#fff",
        borderRadius: "20px",
        boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
        overflow: "hidden",
        position: "relative",
        padding: 2,
        width: "100%",
        ...theme.applyStyles("dark", {
          background: theme.vars.palette.grey[900]
        })
      })]}
    >
      {/* Wallet Icon */}
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          background: "rgba(255, 255, 255, 0.2)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AccountBalanceWalletIcon sx={{ fontSize: 50, color: "rgba(255, 255, 255, 0.3)" }} />
      </Box>

      <CardContent>
        {/* Header */}
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          My Wallet
        </Typography>

        <Box
          sx={{
            mt: 3,
            display: "flex",
            gap: 2,
            flexDirection: "column",
          }}
        >
            {/* Credit */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
              paddingBottom: 1,
            }}
          >
            <Typography variant="body1" sx={{ fontSize: "1rem" }}>
              Credit
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ${wallet?.credit ?? 0}
            </Typography>
          </Box>
          {/* Amount */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
              paddingBottom: 1,
            }}
          >
            <Typography variant="body1" sx={{ fontSize: "1rem" }}>
              Coins
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
            💰{wallet?.amount ?? 0}
            </Typography>
          </Box>

          {/* Bonus */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body1" sx={{ fontSize: "1rem" }}>
              Bonus
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
            💰{wallet?.bonus ?? 0}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GameWallet;
