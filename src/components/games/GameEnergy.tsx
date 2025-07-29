'use client'
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { toast } from "react-toastify";
import { useSocketIoContext } from "@/context/SocketIoContext";
import _debounce from "lodash/debounce"
import { GameEventEnum } from "@/types";
import PaperLayout from "./PaperLayout";


const RechargeButton = ({
  text,
  item,
  onUpdate,
}: {
  text: string;
  item: {
    energy: number;
    amount: number;
  };
  onUpdate: (updatedItem: { energy: number; amount: number }) => void;
}) => {
  const [wallet, setWallet] = useState(item);

  const [isCharging, setIsCharging] = useState(false);

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const generateRandomIncrement = () => Math.floor(Math.random() * 10) + 1; // Random 1-10%

  const startCharging = () => {
    if (isCharging && wallet.amount <= 0) return;
    if (wallet.energy >= 100) {
      setWallet((prev) => ({ ...prev, energy: 100 }));
      return;
    }
    setIsCharging(true);
    intervalRef.current = setInterval(() => {
      setWallet((prev) => {
        if (prev.energy >= 100 || prev.amount <= 0) {
          stopCharging(); // Stop charging when energy is full or credit is exhausted
          prev.energy >= 100 && toast.info(text);
          return prev;
        }

        const increment = generateRandomIncrement();
        const newEnergy = Math.min(prev.energy + increment, 100);
        const creditCost = increment * 10; // 10 credits per 1% energy

        if (prev.amount < creditCost) {
          stopCharging(); // Stop if not enough credit
          return prev;
        }

        const updatedWallet = {
          ...prev,
          energy: newEnergy,
          amount: prev.amount - creditCost,
        };

        onUpdate(updatedWallet); // Notify parent of updates
        return updatedWallet;
      });
    }, 300); // Adjust charging interval speed
  };

  const stopCharging = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsCharging(false);
  };

  React.useEffect(() => {
    setWallet(item); // Sync with the parent state whenever props change
  }, [item]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        gap: 2,
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: 80,
          height: 80,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
          boxShadow:
            "inset 0px 0px 15px rgba(0, 0, 0, 0.3), 0px 4px 15px rgba(0, 0, 0, 0.2)",
          userSelect: "none",
          border: "10px solid aliceblue",
        }}
        onMouseDown={startCharging} // Start charging for desktop
        onMouseUp={stopCharging} // Stop charging for desktop
        onMouseLeave={stopCharging} // Handle user moving away
        onTouchStart={startCharging} // Start charging for mobile
        onTouchEnd={stopCharging} // Stop charging for mobile
      >
        <CircularProgress
          variant="determinate"
          value={wallet.energy}
          size={80}
          thickness={3}
          sx={{
            position: "absolute",

            ...(wallet.energy === 100
              ? {
                  color: "#FF8E53",
                }
              : { color: "#FE6B8B" }),
          }}
        />
        <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
        }}
      >
        <Typography
          variant="caption"
          component="div"
          sx={{ color: 'common.white', cursor: 'pointer'}}
        >{`${Math.round(wallet.energy)}%`}</Typography>
      </Box>
        <BoltIcon
          sx={{
            fontSize: 70,
            cursor: 'pointer',
            color: isCharging ? "#FE6B8B" : "orange",
            transition: "transform 0.3s ease",
            transform: isCharging ? "scale(1.2)" : "scale(1)",
            animation: isCharging ? "pulse 1s infinite" : "none", // Add pulsing effect during charging
            "@keyframes pulse": {
              "0%": {
                transform: "scale(1)",
              },
              "50%": {
                transform: "scale(1.2)",
              },
              "100%": {
                transform: "scale(1)",
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

const GameEnergy = () => {
  const { energy, socketIo } = useSocketIoContext()

  const [state, setState] = useState({
    gameEnergy: energy ? energy : { gauge: 0, turbo: 0, amount: 0, playerId: "", catId: "", id: "" },
  });

  const debounceServerUpdate = _debounce((params: { gauge: number; amount: number; turbo: number; catId: string; playerId: string; id: string }) => {
    console.log("GAME_ROOM_POWER - server update emitted", params)
    socketIo?.emit(GameEventEnum.GAME_PLAYER_ENERGY, params )
  }, 2000)

  const updateEnergy = _debounce((key: "gauge" | "turbo", updatedItem: { energy: number; amount: number }) => {
    setState((prev) => {
      const update = {
        ...prev,
        gameEnergy: {
          ...prev.gameEnergy,
          [key]: updatedItem.energy,
          amount: updatedItem.amount,
        },
      }
      const gameEnergy = update.gameEnergy
      debounceServerUpdate({
        id: gameEnergy.id,
        amount: gameEnergy.amount, 
        gauge: gameEnergy.gauge, 
        turbo: gameEnergy.turbo, 
        playerId: gameEnergy.playerId, 
        catId: gameEnergy.catId
      })
      return update
    });
    
  },100)

  useEffect(() => {
    setState(prev => ({...prev, gameEnergy:  energy ? energy : prev.gameEnergy}))
    return () => {}
  }, [energy])
  

  return (
    // <PaperLayout>
    <Box sx={{ px: 2, py: 1 }}>
      <Card
        sx={[(theme) => ({
          background: theme.vars.palette.gradient.E900,
          color: "#fff",
          borderRadius: "20px",
          boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
          overflow: "hidden",
          position: "relative",
          padding: 2,
          width: "100%",
          height: 150,
          ...theme.applyStyles("dark", {
            background: theme.vars.palette.grey[900]
          })
        })]}
      >
        <Box
          sx={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AccountBalanceWalletIcon
            sx={{ fontSize: 50, color: "rgba(255, 255, 255, 0.3)" }}
          />
        </Box>

        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Game Energy
          </Typography>

          <Box
            sx={{
              mt: 3,
              display: "flex",
              gap: 2,
              flexDirection: "column",
            }}
          >
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
                Energy
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                💰{state.gameEnergy.amount}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ p: 1 }}>
        <Typography variant="h6" sx={{ fontFamily: "PlayFair" }}>
          Always Remember to come here & recharge to play tiredlessly
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Stack
          sx={{ width: "100%" }}
          mt={1}
          spacing={2}
          direction={"row"}
          justifyContent={"space-between"}
        >
          <Box>
            <RechargeButton
              text={"Energy Gauge is filled"}
              item={{
                amount: state.gameEnergy.amount,
                energy: state.gameEnergy.gauge,
              }}
              onUpdate={(updatedItem) => updateEnergy("gauge", updatedItem)}
            />
            <Typography sx={{ py: 1, fontFamily: "PlayFair" }} textAlign={"center"}>
              Energy Gauge
            </Typography>
          </Box>
          <Box>
            <RechargeButton
              text={"Turbo is supercharged"}
              item={{
                amount: state.gameEnergy.amount,
                energy: state.gameEnergy.turbo,
              }}
              onUpdate={(updatedItem) => updateEnergy("turbo", updatedItem)}
            />
            <Typography sx={{ py: 1, fontFamily: "PlayFair" }} textAlign={"center"}>
              Turbo Boost
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
    // </PaperLayout>
  );
};

export default GameEnergy;