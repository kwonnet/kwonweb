"use client";
import * as React from "react";
import { Button } from "@mui/material";
import { GameRoomRankingEnum, UserCategoryRanking } from "@/types";
import { getGamePlayerRankings } from "@/lib/games";
import useSWR from "swr";
import { Stack, Box, Typography, Skeleton } from "@mui/material";
import { formatNumberWithCommas } from "@/utils";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import NativeSelect from "@mui/material/NativeSelect";
import Link from "next/link";
import { useAuthSession } from "@/hooks";

const SkeletonStats = () => {
  return (
    <Stack
      direction={"row"}
      spacing={2}
      sx={{ justifyContent: "space-around" }}
    >
      {[1, 2, 3].map((_, index) => (
        <Box key={index}>
          {/* Skeleton for the title */}
          <Skeleton
            variant="text"
            width={60}
            height={24}
            sx={{ fontFamily: "PlayFair" }}
          />
          {/* Skeleton for the value */}
          <Skeleton
            variant="text"
            width={40}
            height={18}
            sx={{ fontSize: "0.875rem", fontFamily: "PlayFair" }}
          />
        </Box>
      ))}
    </Stack>
  );
};

const rankingBtns = [
  { title: "Today", value: GameRoomRankingEnum.TODAY },
  { title: "This Week", value: GameRoomRankingEnum.WEEK },
  { title: "This Month", value: GameRoomRankingEnum.MONTH },
];

const DisplayItem = ({ item }: { item: UserCategoryRanking }) => {
  return (
    <Stack
      direction={"row"}
      spacing={2}
      sx={{ justifyContent: "space-around" }}
    >
      <Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", fontFamily: "PlayFair" }}
        >
          Rank
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontSize: "0.875rem", fontFamily: "PlayFair" }}
        >
          {formatNumberWithCommas(item.rank)}
        </Typography>
      </Box>
      <Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", fontFamily: "PlayFair" }}
        >
          Score
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontSize: "0.875rem", fontFamily: "PlayFair" }}
        >
          {formatNumberWithCommas(item.score)}
        </Typography>
      </Box>
      <Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", fontFamily: "PlayFair" }}
        >
          Played
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontSize: "0.875rem", fontFamily: "PlayFair" }}
        >
          {formatNumberWithCommas(item.numPlayed)}
        </Typography>
      </Box>
    </Stack>
  );
};

export default function UserRanking() {
  const { user, token } = useAuthSession();

  const [state, setState] = React.useState({
    rankType: GameRoomRankingEnum.TODAY,
    activeCat: 0,
  });

  const {
    data: rankingData,
    isLoading,
    error,
  } = useSWR(
    { params: { userId: user.id, rankType: state.rankType }, token },
    (key) => getGamePlayerRankings(key.params, key.token)
  );

  const handleRanking = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    val: GameRoomRankingEnum
  ) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, rankType: val, page: 1 }));
  };

  const isEmptyData = !rankingData || rankingData.length === 0;

  if (isLoading && !rankingData) {
    return <SkeletonStats />;
  }

  if (isEmptyData) {
    return (
      <Box>
        <Typography variant="caption">
          Participate in a game to see your ranking appear here.
        </Typography>
        <Box sx={{ py: 1, textAlign: "center" }}>
          <Button
            variant="outlined"
            size="small"
            color="inherit"
            LinkComponent={Link}
            href="/games"
          >
            Play Game
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ position: "relative" }}>
        <Stack
          direction="row"
          sx={{
            justifyContent: "center",
            mb: 1,
            width: "100%",
            zIndex: 9,
          }}
          spacing={2}
        >
          {rankingBtns.map((item) => (
            <Button
              key={item.title}
              variant="outlined"
              size="small"
              color="inherit"
              sx={{
                // marginY: 1,
                height: "100%",
                boxShadow: 5,
                borderRadius: 30,
                ...(state.rankType === item.value && {
                  background: (theme) => theme.vars.palette.gradient[200],
                  color: (theme) => theme.vars.palette.gradient.contrastText,
                }),
                "&:hover": {
                  background: (theme) => theme.vars.palette.gradient[200],
                  color: (theme) => theme.vars.palette.gradient.contrastText,
                  transition: "2s ease-out",
                },
              }}
              onClick={(ev) => handleRanking(ev, item.value)}
            >
              {item.title}
            </Button>
          ))}
        </Stack>

        <Box>
          <Box sx={{ py: 1 }}>
            <FormControl fullWidth>
              <InputLabel
                sx={{ textAlign: "center", display: "block" }}
                size="small"
                variant="standard"
                htmlFor="uncontrolled-native"
              >
                Game Category
              </InputLabel>
              <NativeSelect
                inputProps={{
                  name: "age",
                  id: "uncontrolled-native",
                }}
                variant="outlined"
                value={state.activeCat}
                onChange={(ev) =>
                  setState((prev) => ({
                    ...prev,
                    activeCat: parseInt(ev.target.value),
                  }))
                }
              >
                {rankingData.map((item, index) => (
                  <option key={item.id} value={index}>{item.category.name}</option>
                ))}
              </NativeSelect>
            </FormControl>
          </Box>
          <Typography
            variant="caption"
            sx={{
              textAlign: "center",
              fontFamily: "PlayFair",
              fontStyle: "italic",
            }}
          >
            Your Ranking - {rankingData[state.activeCat]?.category?.game?.name}{" "}
            - {rankingData[state.activeCat]?.category?.name} category
          </Typography>
          <DisplayItem item={rankingData[state.activeCat]} />
        </Box>
      </Box>
    </Box>
  );
}
