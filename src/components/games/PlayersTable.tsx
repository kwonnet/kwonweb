"use client";
import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { GamePlayer } from "@/types";

const PlayersTable = ({
  currentUserId,
  players,
  title,
}: {
  currentUserId: string;
  players: GamePlayer[];
  title: string;
  Component?: React.ReactNode;
  TopContent?: React.ReactNode;
}) => {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography
        variant="h5"
        sx={{
          py: "1px",
          fontFamily: "PlayFair",
          fontWeight: "bold",
          // marginBottom: 0.5,
          textAlign: "center",
        }}
      >
        {title}
      </Typography>
      <TableContainer>
        <Table stickyHeader size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                Rank
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                Player
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                Score
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                Played
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players.map((player, index) => (
              <TableRow
                key={index}
                sx={[
                  (theme) => ({
                    ...(currentUserId === player.id && { bgcolor: "grey.300"}),
                    ...(currentUserId !== player.id && { "&:nth-of-type(odd)": { bgcolor: "#f9f9f9" },}),
                    ...theme.applyStyles("dark", {
                      ...(currentUserId === player.id && { bgcolor: theme.vars.palette.grey[800]}),
                      ...(currentUserId !== player.id && { "&:nth-of-type(odd)": { bgcolor: theme.vars.palette.grey[600] },}),
                    }),
                  }),
                ]}
              >
                <TableCell>{player.rank}</TableCell>
                <TableCell>{player.name}</TableCell>
                <TableCell>{player.score}</TableCell>
                <TableCell>{player.numPlayed}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PlayersTable;
