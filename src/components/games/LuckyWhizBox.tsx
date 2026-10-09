'use client'
import { Box, Button, Grid, Typography } from "@mui/material";
import React, { useMemo, useState } from "react";
import { useSocketIoContext } from "@/context/SocketIoContext";
import { GameEventEnum } from "@/types";
import { shuffleArray } from "@/utils";
import { useNotifications } from "@/providers/NotificationsProvider";
import { useGameSocketIoContext } from "@/context/GameSocketIoContext";

const LuckyWhizBox = () => {

  const { question, gameRoomInfo, countdown, energy, gameSocketIo: socketIo } = useGameSocketIoContext();

  const [state, setState] = useState({choice: ""})

  const notif = useNotifications()

  const handleAnswer = (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,choice: string) => {
    ev.preventDefault()
    if(!energy) {
      return notif.show("You don't have have enough energy to play, please switch to energy tab & recharge!", { severity: "warning", autoHideDuration: 4000})
    }
    if(energy?.gauge <= 5 || energy?.turbo <= 5) {
      return notif.show("Your game energy is low, please switch to energy tab & recharge!", { severity: "warning", autoHideDuration: 4000})
    }
    socketIo?.emit(GameEventEnum.GAME_ROOM_ANSWER, { answer: choice, timer: countdown, qId: question?.id, roundId: question?.roundId, gameType: gameRoomInfo?.gameType, catType: gameRoomInfo?.catType});
    setState({choice})
  }
  const options = useMemo(() => {
    return shuffleArray(question?.options ?? [])
  }, [question?.options])
  return (
    <Box sx={{px: 3, py: 1, height: "100%", position: "relative", overflowY: "auto"}}>
      <Box>
        <Typography component={'p'} variant="caption" sx={{ fontFamily: "PlayFair", my: 0.5, color: "text.secondary" }}>
          Lucky Whizard ~ Let's see how lucky you are against your village people.
        </Typography>
        <Typography variant="h5" sx={{ fontFamily: "PlayFair", marginTop: 1, color: "text.secondary" }}>
          {question?.question}
        </Typography>
      </Box>
      <Box sx={{ marginTop: 2 }}>
        <Grid container spacing={2}>
          {options.map(
            (option, index) => (
              <Grid key={index} size={{ lg: 3, md: 3, sm: 6, xs: 6 }}>
                <Button
                  fullWidth
                  variant={state.choice === option ? "contained" : "outlined"}
                  color="primary"
                  type="button"
                  aria-pressed={state.choice === option}
                  size="small"
                  sx={{
                    marginY: 1,
                    height: "100%",
                    boxShadow: 3,
                  }}
                  onClick={(ev) => handleAnswer(ev,option)}
                >
                  {option}
                </Button>
              </Grid>
            )
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default LuckyWhizBox;
