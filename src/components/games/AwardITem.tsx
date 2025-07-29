'use client'
import { GameAchievement } from "@/types";
import { Box, CardMedia, Paper, Stack, Typography } from "@mui/material";
import React from "react";
import { CoinsSvgIcon } from "../svg";
import { formatNumber } from "@/utils";

const AwardITem = ({ item }: { item: GameAchievement }) => {
  return (
    <Paper id={item.id} sx={{ my: 1 }}>
      <Stack direction={"row"} sx={{ justifyItems: "center" }} spacing={1}>
      <Box sx={{p: 1}}>
      <CardMedia sx={{height: 120, width: 120, borderRadius: 5}} image={item.thumbnail} />
      </Box>
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", fontFamily: "PlayFair" }}
          >
            {item.reason?.replaceAll("_", " ")}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontFamily: "PlayFair", fontSize: 12, fontStyle: "italic" }}
          >
            {item.category?.name}
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "PlayFair" }}>
            {item.description}
          </Typography>
          {item.amount > 0 && (
            <Typography variant="caption" sx={{ fontFamily: "PlayFair", fontStyle: "italic" }}>
              Won <CoinsSvgIcon style={{ fontSize: 12 }} />{" "}
              {formatNumber(item.amount)} in {item.rewardType}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

export default AwardITem;
