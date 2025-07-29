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
} from "@mui/material";
import { GameWinner } from "@/types";
import { formatNumberWithCommas } from "@/utils";

const WinnersTable = ({ winners, title, currentUserId }:{  winners: GameWinner[], title: string, currentUserId: string, Component?: React.ReactNode, TopContent?: React.ReactNode,}) => {

  return (
    <Box sx={{mb: 1}}>
        <TableContainer>
          <Table stickyHeader size="small" aria-label="a dense table">
            <TableHead>
              <TableRow>
              <TableCell
                  sx={{ fontWeight: "bold", color: "text.primary" }}
                >
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
                <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                  Reward
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                  Currency
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                  Type
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {winners.map((item) => (
                <TableRow
                  key={item.id}
                  sx={[(theme) => ({
                    // "&:nth-of-type(odd)": { bgcolor: "#f9f9f9" },
                    ...(currentUserId === item.id && { bgcolor: "grey.300", ...theme.applyStyles("dark", { bgcolor: theme.vars.palette.grey[700]})}),
                    ...(currentUserId !== item.id && { "&:nth-of-type(odd)": { bgcolor: "#f9f9f9" },})
                  })]}
                >
                  <TableCell>{item.rank}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{formatNumberWithCommas(item.score)}</TableCell>
                  <TableCell>{formatNumberWithCommas(item.numPlayed)}</TableCell>
                  <TableCell>{formatNumberWithCommas(item?.txn?.amount ?? 0)}</TableCell>
                  <TableCell>{item?.txn?.currency}</TableCell>
                  <TableCell>{item?.txn?.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
    </Box>
  );
};

export default WinnersTable;
