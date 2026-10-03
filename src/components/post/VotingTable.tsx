"use client";
import { useSocketIoContext } from "@/context/SocketIoContext";
import React, { useState } from "react";
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useAuthSession } from "@/hooks";
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import { GameEventEnum } from "@/types";
import { useGameSocketIoContext } from "@/context/GameSocketIoContext";

const VotingTable = () => {

  const { user } = useAuthSession()

  // const { question, countdown, roomAnswers, socketIo } = useSocketIoContext();

  const { question, countdown, roomAnswers, gameSocketIo: socketIo } = useGameSocketIoContext();


  const [state, setState] = useState<{votedId?: string}>({votedId: undefined})

  const handleVoting = (args: { answerId: string, roomId: string; votedUserId: string}) => {
    socketIo?.emit(GameEventEnum.GAME_ROOM_VOTE, { ...args, roundId: question?.roundId, timer: countdown});
    setState(prev => ({...prev, votedId: args.answerId }))
  }

  if(roomAnswers.length === 0){
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
          Please Vote!
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
                  Answer
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                  Timer
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                  Vote
                </TableCell>
                
              </TableRow>
            </TableHead>
            <TableBody>
              {roomAnswers.map((item, index) => (
                <TableRow
                  key={index}
                  sx={{
                    // "&:nth-of-type(odd)": { bgcolor: "#f9f9f9" },
                    ...(user.id === item.playerId && { bgcolor: "grey.300"}),
                    ...(user.id !== item.playerId && { "&:nth-of-type(odd)": { bgcolor: "#f9f9f9" },})
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.answer}</TableCell>
                  <TableCell>{item.timer}</TableCell>
                  <TableCell onClick={() => item.playerId !== user.id ?  handleVoting({answerId: item.answerId, roomId: item.roomId, votedUserId: item.playerId}) : {} }>
                    {
                    item.playerId !== user.id ? item.answerId !== state.votedId ? 
                    <IconButton><FavoriteBorderOutlinedIcon />
                    </IconButton> 
                    : <IconButton><DoneAllOutlinedIcon /></IconButton> : null
                  }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default VotingTable;
