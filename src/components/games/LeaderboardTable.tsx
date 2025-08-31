"use client";
import { Box, Button, Pagination, Stack } from "@mui/material";
import React, { useEffect, useState } from "react";
import PlayersTable from "./PlayersTable";
import { useSocketIoContext } from "@/context/SocketIoContext";
import useSWR from "swr";
import { GameRoomRankingEnum } from "@/types";
import { getSwrPlayers } from "@/lib/swrHooks";
import SkeletonTable from "./SkeletonTable";
import PaperLayout from "./PaperLayout";
import { useAuthSession } from "@/hooks";
import { useGameSocketIoContext } from "@/context/GameSocketIoContext";

const ITEM_PER_PAGE = 12;

function PlayerPage({
  query,
  currentUserId,
}: {
  query: string;
  currentUserId: string;
}) {
  const { token } = useAuthSession()
  const { data, isLoading } = useSWR({query, token}, getSwrPlayers);
  if (!data && isLoading) return <SkeletonTable />;
  if(!data) return null
  return (
    <PlayersTable
      title="Leaderboard"
      players={data}
      currentUserId={currentUserId}
    />
  );
}

const rankingBtns = [
  { title: "Today", value: GameRoomRankingEnum.TODAY },
  { title: "This Week", value: GameRoomRankingEnum.WEEK },
  { title: "This Month", value: GameRoomRankingEnum.MONTH },
];

const getPaginationCount = (total: number) => {
  return Math.ceil(total / ITEM_PER_PAGE);
};

const LeaderboardTable = ({
  currentUserId,
  catId,
  mode
}: {
  currentUserId: string;
  catId: string;
  mode: string;
}) => {
  const { gameScores, monthTotalPlayers, weekTotalPlayers, todayTotalPlayers } =
    useGameSocketIoContext();

  const [state, setState] = useState({
    page: 1,
    refreshInterval: 0,
    ranking: GameRoomRankingEnum.TODAY,
    totalPlayers: todayTotalPlayers,
  });

  const handleFetch = (ev: any, page: number) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, page }));
  };

  useEffect(() => {
    if (gameScores.length === 0) return;
    // mutate(data, { rollbackOnError: true });
    return () => {};
  }, [gameScores]);

  useEffect(() => {
    const getTotalPlayers = () => {
      if (state.ranking === GameRoomRankingEnum.MONTH) {
        return monthTotalPlayers;
      }
      if (state.ranking === GameRoomRankingEnum.WEEK) {
        return weekTotalPlayers;
      }
      return todayTotalPlayers;
    };

    setState((prev) => ({ ...prev, totalPlayers: getTotalPlayers() }));

    return () => {};
  }, [monthTotalPlayers, weekTotalPlayers, todayTotalPlayers, state.ranking]);

  const handleRanking = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    val: GameRoomRankingEnum
  ) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, ranking: val, page: 1 }));
  };

  const totalPages = getPaginationCount(state.totalPlayers);

  return (
    // <PaperLayout boxHeight={boxHeight}>
    <React.Fragment>
      <Box sx={{ position: "relative" }}>
        <Stack
          direction="row"
          sx={{
            justifyContent: "center",
            mb: 1,
            pt: 0.5,
            position: "absolute",
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
              sx={[
                (theme) => ({
                  // marginY: 1,
                  height: "100%",
                  boxShadow: 5,
                  ...(state.ranking === item.value && {
                    background: theme.vars.palette.gradient.D900,
                    color: theme.vars.palette.gradient.contrastText,
                  }),
                  "&:hover": {
                    background: theme.vars.palette.gradient.D900,
                    color: "white",
                    transition: "2s ease-out",
                  },
                  ...theme.applyStyles("dark", {
                    color: theme.vars.palette.gradient.contrastText,
                  }),
                }),
              ]}
              onClick={(ev) => handleRanking(ev, item.value)}
            >
              {item.title}
            </Button>
          ))}
        </Stack>
      </Box>
      <div style={{ display: "none" }}>
        <PlayerPage
          currentUserId={currentUserId}
          query={`/v1/games/leaderboard?type=board&mode=${mode}&ranking=${state.ranking}&catId=${catId}&limit=${ITEM_PER_PAGE}&page=${state.page + 1 > totalPages ? state.page : state.page + 1}`}
        />
      </div>

      <Box
        sx={{
          paddingTop: 5,
          position: "relative",
          height: "100%",
          overflow: "auto",
        }}
      >
        <PlayerPage
          currentUserId={currentUserId}
          query={`/v1/games/leaderboard?type=board&mode=${mode}&ranking=${state.ranking}&catId=${catId}&limit=${ITEM_PER_PAGE}&page=${state.page}`}
        />
      </Box>

      <Box sx={{ position: "relative" }}>
        <Box sx={{ position: "absolute", bottom: 3 }}>
          {state.totalPlayers > 0 && (
            <Pagination
              size="small"
              onChange={(_ev, page) => handleFetch(_ev, page)}
              page={state.page}
              showFirstButton
              showLastButton
              count={totalPages}
            />
          )}
        </Box>
      </Box>
    </React.Fragment>
    // </PaperLayout>
  );
};

export default LeaderboardTable;
