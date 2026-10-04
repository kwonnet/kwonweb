"use client";
import { Box, Paper, Stack, Typography, useTheme } from "@mui/material";
import React, { useMemo, useState } from "react";
import { claimDailyBonus } from "@/lib/wallets";
import { getRandomNumber, getTimeDifference, shuffleArray } from "@/utils";
import { BonusTypeEnum } from "@/types";
import { Fade } from "react-awesome-reveal";
import Countdown from "react-countdown";
import { useAuthSession } from "@/hooks";
import { WheelComponent } from "@/components/games";
import { useNotifications } from "@/providers/NotificationsProvider";


const DailyBonus = ({
  data,
}: {
  data?: {
    id: string;
    userId: string;
    dailyBonusDate: string;
    adsBonusDate: string;
    createdAt: string;
    updateAt: string;
  };
}) => {
  const { token } = useAuthSession();

  const theme = useTheme();

  const notfif = useNotifications()

  const date = new Date();

  const timer = getTimeDifference(new Date(data?.dailyBonusDate ?? date));

  const [state, setState] = useState<{
    date?: string;
    isProcessing?: boolean;
  }>({
    date: data?.dailyBonusDate,
    isProcessing: timer.minutes > 0 || timer.seconds > 0 ? true : false,
  });

  const handleClaimDailyBonus = (amount: number) => {
    // make api call
    const currDate = new Date();
    const date = new Date(
      currDate.getTime() + 24 * 60 * 60 * 1000
    ).toISOString();
    claimDailyBonus({ amount, date, type: BonusTypeEnum.BONUS }, token);
    // notify user
    notfif.show(`You have earned ${amount} bonus coins`, {
      autoHideDuration: 2500,
      severity: "success"
    });
    setState((prev) => ({
      ...prev,
      date,
      isProcessing: true,
    }));
  };

  const getRandomOptions = () => {
    const set = new Set<string>();
    while (Array.from(set).length < 5) {
      const element = getRandomNumber(5, 10).toString();
      set.add(element);
    }
    return Array.from(set);
  };

  const options = useMemo(() => {
    return shuffleArray(getRandomOptions());
  }, []);
  const segColors = [
    theme.palette.primary.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.secondary.main,
  ];
  const onFinished = (point: string) => {
    handleClaimDailyBonus(parseFloat(point));
  };

  return (
    <Box>
      <Fade>
        <Box>
          <Paper
            sx={[
              (theme) => ({
                p: 2,
                mb: 1,
                ...theme.applyStyles("dark", {
                  background: theme.vars.palette.grey[900],
                }),
              }),
            ]}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: "PlayFair", fontWeight: "bold" }}
            >
              Spin lucky wheel to receive daily bonus
            </Typography>

            <Box sx={{ display: "block", textAlign: "center", pt: 1 }}>
              <WheelComponent
                segments={options}
                segColors={segColors}
                onFinished={(winner: string) => onFinished(winner)}
                primaryColor={theme.palette.primary.main}
                strokeColor={theme.palette.tints[900]}
                contrastColor={"white"}
                buttonText="Spin"
                isOnlyOnce={true}
                size={100}
                upDuration={100}
                downDuration={200}
                fontFamily="Arial"
                playSound={undefined}
                stopSound={undefined}
                disabled={state.isProcessing}
              />

              
            </Box>
            <Box sx={{py: 1}}>
            {state.isProcessing && (
                <Stack
                  direction={"row"}
                  spacing={2}
                  sx={{ justifyContent: "center", alignItems: "center" }}
                >
                  <Typography>Next Spin: </Typography>
                  <Countdown date={state.date} onComplete={() => setState(prev => ({...prev, isProcessing: false }))} />
                </Stack>
              )}
            </Box>
          </Paper>
        </Box>
      </Fade>
    </Box>
  );
};

export default DailyBonus;
