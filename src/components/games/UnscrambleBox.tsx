"use client";
import { handleGameInputEnter, stopGameInputEnterKeyUp } from "@/utils/game-input";
import React, { useEffect, useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { useSocketIoContext } from "@/context/SocketIoContext";
import { GameEventEnum } from "@/types";
import { useNotifications } from "@/providers/NotificationsProvider";
import { useGameSocketIoContext } from "@/context/GameSocketIoContext";

const UnscrambleBox = () => {
  const { question, gameRoomInfo, countdown, energy, gameSocketIo: socketIo } =
    useGameSocketIoContext();

  const [state, setState] = useState({ answer: "", prevAnswer: "", timer: 0 });
  
  const notif = useNotifications()

  const handleAnswer = (answer: string): boolean => {
    if (!energy) {
      notif.show("You don't have have enough energy to play, please switch to energy tab & recharge!", { severity: "warning", autoHideDuration: 4000 });
      return false;
    }
    if (energy.gauge <= 5 || energy.turbo <= 5) {
      notif.show("Your game energy is low, please switch to energy tab & recharge!", { severity: "warning", autoHideDuration: 4000 });
      return false;
    }
    if (!socketIo) return false;
    socketIo.emit(GameEventEnum.GAME_ROOM_ANSWER, {
      answer, timer: countdown, qId: question?.id, roundId: question?.roundId,
      gameType: gameRoomInfo?.gameType, catType: gameRoomInfo?.catType,
    });
    setState(prev => ({ ...prev, prevAnswer: answer, timer: countdown }));
    return true;
  };

  const handleSendMessage = () => {
    if (state.answer.trim()) {
      const submitted = handleAnswer(state.answer.trim());
      setState((prev) => ({ ...prev, answer: "" }));
      return submitted;
    }
  };

  useEffect(() => {
    const paragraph = document.getElementById("noCopy");

    // Disable the copy event
    const handleCopy = (event: any) => {
      event.preventDefault(); // Prevent the copy action
    };

    // Add event listener for copy event
    paragraph?.addEventListener("copy", handleCopy);

    // Cleanup event listener on component unmount
    return () => {
      paragraph?.removeEventListener("copy", handleCopy);
    };
  }, []);

  return (
    <React.Fragment>
      <Box
        sx={{
          position: "relative",
          height: "100%",
          flex: 1,
          overflowY: "auto",
          px: 2,
          pt: 2,
          borderRadius: 2,
          // bgcolor: "background.paper",
          boxShadow: "inset 0px 0px 5px rgba(0,0,0,0.1)",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          scrollbarWidth: "thin", // Firefox
          scrollbarColor: "rgba(0, 0, 0, 0.2) transparent",
        }}
      >
        <Typography variant="h6" sx={{ fontFamily: "PlayFair" }}>
          Rearrange the words to form the correct sentence
        </Typography>
        <Typography
          id="noCopy"
          variant="h4"
          sx={{
            fontWeight: 800,
            fontFamily: "PlayFair",
            textAlign: "center",
            userSelect: "none", // Prevent text selection
            WebkitUserSelect: "none", // Safari
            MozUserSelect: "none", // Firefox
            MsUserSelect: "none", // Older IE
          }}
          component={"strong"}
        >
          {question?.question}
        </Typography>
        <Box sx={{ textAlign: "center", display: "block" }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              fontFamily: "PlayFair",
              textAlign: "center",
            }}
          >
            {state.prevAnswer}
            {state.timer > 0 && `: ${state.timer}`}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          // mt: 2,
          display: "flex",
          alignItems: "center",
          width: "100%",
          p: 2,
          // bgcolor: "background.paper",
          borderTop: "1px solid #e0e0e0",
          borderBottomRightRadius: 12,
          borderBottomLeftRadius: 12,
        }}
      >
        <TextField
          value={state.answer}
          onChange={(e) =>
            setState((prev) => ({ ...prev, answer: e.target.value }))
          }
          placeholder="Type your message"
          variant="outlined"
          size="small"
          fullWidth
          multiline
          maxRows={4}
          autoFocus={true}
          sx={{
            borderRadius: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              // bgcolor: "background.paper",
            },
          }}
          onKeyDown={event => handleGameInputEnter(event, handleSendMessage)}
          onKeyUp={stopGameInputEnterKeyUp}
        />
        <Button
          type="button"
          onClick={() => handleSendMessage()}
          variant="contained"
          // color="primary"
          sx={[
            (theme) => ({
              ml: 1,
              background: theme.vars.palette.gradient.D900,
            }),
          ]}
        >
          Send
        </Button>
      </Box>
    </React.Fragment>
  );
};

export default UnscrambleBox;
