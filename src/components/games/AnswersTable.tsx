"use client";
import { useSocketIoContext } from "@/context/SocketIoContext";
import React, { useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
// import { showConfetti } from "@/confetti";
import JSConfetti from 'js-confetti'
import { useGameSocketIoContext } from "@/context/GameSocketIoContext";


// export const showConfetti = async () =>{
//     return await jsConfetti.addConfetti({

//         emojis: ['⚡️', '💥', '✨', '💫', '🌸'],
//         confettiColors: [
//             '#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f9bec7',
//           ],
//         confettiRadius: 20,
//         confettiNumber: 500,
//         emojiSize: 30,

//     })
// }

const AnswersTable = ({currentUserId}:{ currentUserId: string}) => {

  const { gameScores, question } = useGameSocketIoContext();

  const jsConfetti = new JSConfetti()

  
  useEffect(() => {
    const score = gameScores.length === 0 ? null : gameScores[0];
    console.log(`Score:`);
    console.log(score)
    console.log(`currentUserId: ${currentUserId}`);
    if(!score) return;
    if((score.playerId === currentUserId) && score.score > 0){
      console.log("Showing confetti...")
        // showConfetti()
        jsConfetti.addConfetti({

          emojis: ['⚡️', '💥', '✨', '💫', '🌸'],
          confettiColors: [
              '#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f9bec7',
            ],
          confettiRadius: 20,
          confettiNumber: 500,
          emojiSize: 30,
  
      })
    }
    return () => {}
  }, [gameScores])

  if(gameScores.length === 0){
    return null
  }

  return (
    <Box sx={{mb: 1}}>
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          borderRadius: 3,
          boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.1)",
        //   height: "calc(100vh - 150px)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            py: 1,
            fontFamily: "PlayFair",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Round Result!
        </Typography>
        <Typography
          variant="caption"
          component={"p"}
          sx={{
            fontFamily: "PlayFair",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {question?.question}
        </Typography>
        <TableContainer>
          <Table stickyHeader size="small" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                  S/N
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                  Player
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                  Answer
                </TableCell>
                
                <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                  Timer
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold", color: "text.primary" }}
                >
                  Score
                </TableCell>
                
              </TableRow>
            </TableHead>
            <TableBody>
              {gameScores.map((player, index) => (
                <TableRow
                  key={index}
                  sx={[(theme) => ({
                    ...(currentUserId === player.playerId && { bgcolor: "grey.300", color: theme.vars.palette.info.light}),
                    ...(currentUserId !== player.playerId && { "&:nth-of-type(odd)": { bgcolor: theme.vars.palette.grey[200] },}),
                    ...theme.applyStyles("dark", {
                      ...(currentUserId === player.playerId && { bgcolor: theme.vars.palette.grey[800], color: theme.vars.palette.info.light}),
                      ...(currentUserId !== player.playerId && { "&:nth-of-type(odd)": { bgcolor: theme.vars.palette.grey[600] },}),
                    }),
                  })]}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell>{player.answer}</TableCell>
                  <TableCell>{player.timer}</TableCell>
                  <TableCell>{player.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AnswersTable;
