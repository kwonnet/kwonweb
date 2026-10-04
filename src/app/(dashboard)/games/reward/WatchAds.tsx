"use client";
import { publicEnv } from "@/config/public-env";
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { Fade } from "react-awesome-reveal";
import { claimDailyBonus } from "@/lib/wallets";
import { getRandomNumber, getTimeDifference } from "@/utils";
import { BonusTypeEnum } from "@/types";
import Countdown from "react-countdown";
import { getUserTaskSettings } from "@/lib/swrHooks";
import { useAuthSession } from "@/hooks";



const WatchAds = ({ data }: { data?: {
    id: string;
    userId: string;
    dailyBonusDate: string;
    adsBonusDate: string;
    createdAt: string;
    updateAt: string;
}}) => {
  const { token, user } = useAuthSession();

  const date = new Date();

  const timer = getTimeDifference(new Date(data?.adsBonusDate ?? date));

  const [state, setState] = useState<{
    date?: string;
    isProcessing?: boolean;
    isLoading?: boolean;
  }>({
    date: data?.adsBonusDate,
    isProcessing: timer.minutes > 0 || timer.seconds > 0 ? true : false,
     });

  const handleClaimAdsBonus = () => {
    const amount = getRandomNumber(5, 10);
    // make api call
    const currDate = new Date();
    const date = new Date(
      currDate.getTime() + 2 * 60 * 1000
    ).toISOString();
    claimDailyBonus({amount, date, type: BonusTypeEnum.ADS}, token);
    // notify user
    toast.info(`You have earned ${amount} bonus coins watching ads`, {
      autoClose: 1000,
      position: "top-center",
    });
    setState((prev) => ({
      ...prev,
      date,
      isProcessing: true,
    }));
  };


  React.useEffect(() => {
    // @ts-ignore
    if (window.show_8664761) {
      return;
    }
    const tag = document.createElement("script");
    tag.src = String(publicEnv("NEXT_PUBLIC_MONETAG_ADS_SRC"));
    tag.dataset.zone = String(publicEnv("NEXT_PUBLIC_MONETAG_ZONE"));
    tag.dataset.sdk = String(publicEnv("NEXT_PUBLIC_MONETAG_SDK"));
    document.body.appendChild(tag);
  }, []);

  const showAds = async () => {
    // handleWatchAds();
    // @ts-ignore
    show_8664761().then(() => {
      // add here the function that should be executed after viewing the ad
      handleClaimAdsBonus();
    });
  };

  const handleWatchAds = async() => {
    try {
        setState(prev => ({...prev, isLoading: true}))
        const result = await getUserTaskSettings(`/v1/users/${user.id}/task-settings`, token)
        const timer = getTimeDifference(result?.adsBonusDate);
        setState(prev => ({
            ...prev,
            date: result?.adsBonusDate,
            isProcessing: timer.minutes > 0 || timer.seconds > 0 ? true : false,
        }))
        if(timer.minutes > 0 || timer.seconds > 0) return
        await showAds()
    } catch (error: any) {
        error.status === 404 && (await showAds())
    }finally{
        setState(prev => ({...prev, isLoading: false}))
    }
  }

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
                  Watch ads & earn bonus coins every 2 minutes
                </Typography>
                {!state.isProcessing ? (
                  <Box sx={{ display: "block", textAlign: "center", pt: 1 }}>
                    <Button
                      onClick={() => handleWatchAds()}
                      variant="outlined"
                      color="warning"
                      loading={state.isLoading}
                      disabled={state.isLoading}
                    >
                      Watch
                    </Button>
                  </Box>
                ) : (
                    <Box sx={{py: 1}}>
                        <Stack
                        direction={"row"}
                        spacing={2}
                        sx={{ justifyContent: "center", alignItems: "center" }}
                        >
                        <Typography>Time Left: </Typography>
                        <Countdown date={state.date} onComplete={() => setState(prev => ({...prev, isProcessing: false }))} />
                        </Stack>
                    </Box>
                )}
              </Paper>
            </Box>
          </Fade>
    </Box>
  );
};

export default WatchAds;
