"use client";
import React, { useEffect, useState } from "react";
import { Box, TextField, Button, Typography, Chip } from "@mui/material";
import { useSocketIoContext } from "@/context/SocketIoContext";
import { toast } from "react-toastify";
import { GameEventEnum } from "@/types";
import { useNotifications } from "@toolpad/core";
import { useGameSocketIoContext } from "@/context/GameSocketIoContext";

const WordMakerBox = () => {
  const { question, gameRoomInfo, countdown, energy, gameSocketIo: socketIo } =
    useGameSocketIoContext();

    const notif = useNotifications()

  const [state, setState] = useState<{
    answer: string;
    entries: string[];
    timer: number;
}>({ answer: "", entries: [], timer: 0 });

  const handleAnswer = (answer: string) => {
    if(!energy) {
      return notif.show("You don't have have enough energy to play, please switch to energy tab & recharge!", { severity: "warning", autoHideDuration: 4000})
    }
    if(energy?.gauge <= 5 || energy?.turbo <= 5) {
      return notif.show("Your game energy is low, please switch to energy tab & recharge!", { severity: "warning", autoHideDuration: 4000})
    }
    socketIo?.emit(GameEventEnum.GAME_ROOM_ANSWER, {
      answer,
      timer: countdown,
      qId: question?.id, roundId: question?.roundId,
      gameType: gameRoomInfo?.gameType,
      catType: gameRoomInfo?.catType
    });
    setState((prev) => ({ ...prev, entries: [...prev.entries.filter(item => item !== answer), answer], timer: countdown }));
  };

  const handleSendMessage = (ev: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.KeyboardEvent<HTMLDivElement>) => {
    ev.preventDefault();
    const val = state?.answer?.toLowerCase().trim()
    if (!val || val.length < 3 || val === question?.question?.toLowerCase().trim()) return
    handleAnswer(val);
    setState((prev) => ({ ...prev, answer: "" }));
    
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
          {question?.question.includes(",") ? "Craft as many words as possible with 3 letters & above using these letters" : "Form as many words as possible with 3 letters & above using the base word"}
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
        <Box sx={{  display: "block" }}>
          {
            state.entries.map((entry, index) => (<Chip key={index} label={entry} />))
          }
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
          placeholder="Type your guess..."
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
          onKeyDown={(ev) => {
            if (ev.key === "Enter" && !ev.shiftKey) {
              handleSendMessage(ev);
            }
          }}
        />
        <Button
          onClick={(ev) => handleSendMessage(ev)}
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

export default WordMakerBox;
