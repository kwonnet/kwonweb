"use client";
import { Box, Grid, Typography } from "@mui/material";
import React, { useMemo, useState, useRef } from "react";
import { useSocketIoContext } from "@/context/SocketIoContext";
import { GameEventEnum } from "@/types";
import { shuffleArray } from "@/utils";
// import { toast } from "react-toastify";
import ReactCardFlip from "react-card-flip";
import { FlipCardBackSvgIcon, FlipCardFrontSvgIcon } from "../svg";
import { useNotifications } from "@toolpad/core";
import { useGameSocketIoContext } from "@/context/GameSocketIoContext";

const LuckyFlipBox = () => {
  const { question, gameRoomInfo, countdown, energy, gameSocketIo: socketIo } =
    useGameSocketIoContext();

  const [state, setState] = useState<{ flips: string[] }>({ flips: [] });

  const notif = useNotifications()

  const audioRef = useRef<HTMLAudioElement>(null);

  const playAudio = () => {
    audioRef.current?.play();
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset playback position
    }
  };

  const handleAnswer = (choice: string) => {
    if(!energy) {
      return notif.show("You don't have have enough energy to play, please switch to energy tab & recharge!", { severity: "warning", autoHideDuration: 4000})
    }
    if(energy?.gauge <= 5 || energy?.turbo <= 5) {
      return notif.show("Your game energy is low, please switch to energy tab & recharge!", { severity: "warning", autoHideDuration: 4000})
    }
    playAudio()
    setState((prev) => ({ ...prev, flips: [...prev.flips, choice] }));
    socketIo?.emit(GameEventEnum.GAME_ROOM_ANSWER, {
      answer: choice,
      timer: countdown,
      qId: question?.id,
      gameType: gameRoomInfo?.gameType,
      catType: gameRoomInfo?.catType,
    });
    // setTimeout(() => stopAudio(), 700)
  };
  const options = useMemo(() => {
    return shuffleArray(question?.options ?? []);
  }, [question?.options]);

  

  return (
    <Box
      sx={{
        px: 3,
        // py: 1,
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
          marginLeft: -2.5,
        }}
      >
        <Grid container spacing={2}>
          {options.map((option, index) => (
            <Grid key={index} size={{ lg: 4, md: 4, sm: 4, xs: 4 }}>
              <Box sx={{ height: "100%", width: "100%" }}>
                <ReactCardFlip
                  isFlipped={state.flips.includes(option)}
                  flipDirection="vertical"
                >
                  <Box sx={{cursor: "pointer"}} onClick={() => handleAnswer(option)}>
                    <FlipCardBackSvgIcon />
                  </Box>
                  <Box>
                    <FlipCardFrontSvgIcon score={option} />
                  </Box>
                </ReactCardFlip>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
      <audio style={{ display: "none" }} ref={audioRef} src="/sounds/coin-flip-ping.mp3" preload="auto" />
    </Box>
  );
};

export default LuckyFlipBox;


// Coin Flip Ping by el_boss -- https://freesound.org/s/677853/ -- License: Creative Commons 0
// <a href="https://freesound.org/people/el_boss/sounds/677853/">Coin Flip Ping</a> by <a href="https://freesound.org/people/el_boss/">el_boss</a> | License: <a href="http://creativecommons.org/publicdomain/zero/1.0/">Creative Commons 0</a>