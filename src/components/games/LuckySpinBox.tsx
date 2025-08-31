"use client";
import { Box, Typography, useTheme } from "@mui/material";
import React, { useMemo, useRef, useEffect } from "react";
import { useSocketIoContext } from "@/context/SocketIoContext";
import { GameEventEnum } from "@/types";
import { shuffleArray } from "@/utils";
import { toast } from "react-toastify";
import WheelComponent from "./WheelComponent";
import { useNotifications } from "@toolpad/core";
import { useGameSocketIoContext } from "@/context/GameSocketIoContext";

const LuckySpinBox = () => {
  const { question, gameRoomInfo, countdown, energy, gameSocketIo: socketIo } =
    useGameSocketIoContext();

  const theme = useTheme();

  const countdownRef = useRef(countdown);

  const notif = useNotifications()

  // Update the ref whenever countdown changes
  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  const handleAnswer = (choice: string) => {
    if(!energy) {
      return notif.show("You don't have have enough energy to play, please switch to energy tab & recharge!", { severity: "warning", autoHideDuration: 4000})
    }
    if(energy?.gauge <= 5 || energy?.turbo <= 5) {
      return notif.show("Your game energy is low, please switch to energy tab & recharge!", { severity: "warning", autoHideDuration: 4000})
    }
    socketIo?.emit(GameEventEnum.GAME_ROOM_ANSWER, {
      answer: choice,
      timer: countdownRef.current,
      qId: question?.id,
      gameType: gameRoomInfo?.gameType,
      catType: gameRoomInfo?.catType,
    });
  };
  const options = useMemo(() => {
    return shuffleArray(question?.options ?? []);
  }, []);
  const segColors = [
    theme.palette.primary.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.secondary.main,
  ];
  const onFinished = (winner: string) => {
    handleAnswer(winner);
  };

  const audioRef = useRef<HTMLAudioElement>(null);

  const playAudio = () => {
    audioRef.current?.play();
  };

  const pauseAudio = () => {
    audioRef.current?.pause();
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset playback position
    }
  };

  return (
    <Box
      sx={{
        px: 3,
        py: 1,
        height: "100%",
        position: "relative",
        overflowY: "auto",
      }}
    >
      <Box>
        <Typography
          variant="subtitle1"
          sx={{
            fontFamily: "PlayFair",
            marginTop: 0.5,
            color: "text.secondary",
          }}
        >
          {question?.question}
        </Typography>
        <Typography
          component={"p"}
          variant="caption"
          sx={{ fontFamily: "PlayFair", my: 0.5, color: "text.secondary" }}
        >
          How lucky are you against your village people?
        </Typography>
      </Box>
      <Box
        sx={{
          marginTop: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <WheelComponent
          segments={options}
          segColors={segColors}
          onFinished={(winner: string) => onFinished(winner)}
          primaryColor={theme.palette.primary.main}
          strokeColor={theme.palette.tints[900]}
          contrastColor={"white"}
          buttonText="Spin"
          isOnlyOnce={false}
          size={120}
          upDuration={100}
          downDuration={200}
          fontFamily="Arial"
          playSound={playAudio}
          stopSound={stopAudio}
        />
      </Box>
      <audio
        style={{ display: "none" }}
        ref={audioRef}
        src="/sounds/spin.mp3"
        preload="auto"
      />
    </Box>
  );
};

export default LuckySpinBox;

// SPIN SOUND 2
// Coin Spin.wav by keatonmarek -- https://freesound.org/s/533191/ -- License: Attribution 3.0
// <a href="https://freesound.org/people/keatonmarek/sounds/533191/">Coin Spin.wav</a> by <a href="https://freesound.org/people/keatonmarek/">keatonmarek</a> | License: <a href="http://creativecommons.org/licenses/by/3.0/">Attribution 3.0</a>
