"use client";
import React from "react";
import PaperLayout from "./PaperLayout";
import {
  Box,
  CardMedia,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AwardITem from "./AwardITem";
import useSWR from "swr";
import { getUserAchievements } from "@/lib/users";
import { RewardSkeleton } from "../skeleton";
import { getErrorMessage } from "@/utils";
import { useAuthSession } from "@/hooks";
import DisplayError from "@/components/common/DisplayError";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import debounce from "lodash/debounce";

const GameAwards = ({
  currentUserId,
  catId,
}: {
  currentUserId: string;
  catId: string;
}) => {
  const { user, token } = useAuthSession();

  const year = new Date().getUTCFullYear();

  const { data, error, isLoading, mutate } = useSWR(
    { page: 1, limit: 100, catId, year, userId: user.id },
    (query) => getUserAchievements(query, token),
    { revalidateOnFocus: true }
  );

  const dummyData = Array.from({ length: 4 }).map((_, index) => index + 1);

  const isProcessing = !data && isLoading;

  const isError = !!(!data && error && !isLoading);

  const achievements = data ? data.data : [];

  const debounceMutate = debounce(() => {
    mutate();
  }, 700);

  return (
    <React.Fragment>
      <Box sx={{ py: 1, px: 2, height: "100%", overflowY: "auto" }}>
        <Stack
          direction={"row"}
          sx={{
            alignItems: "center",
            justifyContent: "space-between"
          }}>
          <Typography
            variant="h5"
            sx={{
              textAlign: "center",
              fontWeight: 800,
              fontFamily: "PlayFair",
            }}
          >
            Game Achievements
          </Typography>
          <Box sx={{  }}>
            <IconButton onClick={(ev) => debounceMutate()}>
              <RefreshOutlinedIcon />
            </IconButton>
          </Box>
        </Stack>
        {(error && !data) && <DisplayError status={error?.status} message={getErrorMessage(error)} />}
        {isProcessing
          ? dummyData.map((i) => <RewardSkeleton key={i} />)
          : achievements.map((item) => <AwardITem key={item.id} item={item} />)}
      </Box>
    </React.Fragment>
  );
};

export default GameAwards;
