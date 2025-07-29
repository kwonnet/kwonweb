"use client";
import * as React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  Button,
  Container,
  NativeSelect,
  Pagination,
  Paper,
  Skeleton,
  Stack,
} from "@mui/material";
import { GameCategoryRanking, GameRoomRankingEnum } from "@/types";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import { PageHeader, SkeletonTable } from "@/components/common";
import useSWR from "swr";
import { getGameCategoriesRankings } from "@/lib/games";
import Link from "next/link";
import { getSwrPlayers } from "@/lib/swrHooks";
import { getCurrentDataInfo, monthNames } from "@/utils";
import { useAuthSession } from "@/hooks";
import { PlayersTable } from "@/components/games";

const rankingBtns = [
  { title: "Today", value: GameRoomRankingEnum.TODAY },
  { title: "Week", value: GameRoomRankingEnum.WEEK },
  { title: "Month", value: GameRoomRankingEnum.MONTH },
];

const SkeletonStats = () => {
  return (
    <Stack
      direction={"row"}
      spacing={2}
      sx={{ justifyContent: "space-around" }}
    >
      {[1,2,3].map((_, index) => (
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

const ITEM_PER_PAGE = 15;

function PlayerPage({
  query,
  currentUserId,
}: {
  query: string;
  currentUserId: string;
}) {
  const { data, isLoading } = useSWR(query, getSwrPlayers);
  if (!data || isLoading) return <SkeletonTable rows={2} />;
  return (
    <PlayersTable
      title="Leaderboard"
      players={data}
      currentUserId={currentUserId}
    />
  );
}

const getPaginationCount = (total: number) => {
  return Math.ceil(total / ITEM_PER_PAGE);
};

const DisplayRankings = ({
  rankType,
  category,
}: {
  rankType: GameRoomRankingEnum;
  category: GameCategoryRanking;
}) => {

  const { user } = useAuthSession();

  const [state, setState] = React.useState({ page: 1 });

  const handleFetch = (ev: any, page: number) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, page }));
  };

  const totalPages = getPaginationCount(category.totalParticipants);

  return (
    <React.Fragment>
      <div style={{ display: "none" }}>
        <PlayerPage
          currentUserId={user.id}
          query={`/v1/games/leaderboard?type=board-archive&ranking=${rankType}&catId=${
            category.id
          }&limit=${ITEM_PER_PAGE}&page=${
            state.page + 1 > totalPages ? state.page : state.page + 1
          }`}
        />
      </div>

      <Box
        sx={{
          paddingTop: 0,
          position: "relative",
          height: "100%",
          overflow: "auto",
        }}
      >
        <PlayerPage
          currentUserId={user.id}
          query={`/v1/games/leaderboard?type=board-archive&ranking=${rankType}&catId=${category.id}&limit=${ITEM_PER_PAGE}&page=${state.page}`}
        />
      </Box>
      {/* PAGINATION */}
      <Box sx={{ position: "relative" }}>
        <Box>
          {totalPages > 0 && (
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
  );
};

const DisplayComponent = ({ rankType }: { rankType: GameRoomRankingEnum }) => {

  const [state, setState] = React.useState({ activeCat: 0, page: 1 });

  const { token, user } = useAuthSession();

  const dateInfo = getCurrentDataInfo()

  const { data: rankingData, isLoading } = useSWR(
    { type: "categories-ranking", params: { rankType }, token },
    (arg) => getGameCategoriesRankings(arg.params, arg.token)
  );

  const isEmptyData = !rankingData || rankingData.length === 0;

  if (isLoading && !rankingData) {
    return <SkeletonStats />;
  }
  if (isEmptyData) {
    return (
      <Box>
        <Typography variant="caption">
          Participate in a game to see ranking appear here.
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
    <Box sx={{ py: 1 }}>
      <Box sx={{ py: 0, display: "block", textAlign: "center" }}>
        <Typography variant="caption" sx={{fontWeight: 900}}>
        Ranking - { rankType === GameRoomRankingEnum.TODAY ? `${dateInfo.day} ${monthNames[dateInfo.month]} - ${dateInfo.year}`: rankType === GameRoomRankingEnum.WEEK ? `Week ${dateInfo.week} - ${monthNames[dateInfo.month]} - ${dateInfo.year}`: `${monthNames[dateInfo.month]} - ${dateInfo.year}`  } 
        </Typography>
      </Box>
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
            name: "activeCat",
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
            <option key={item.id} value={index}>
              {item.name}
            </option>
          ))}
        </NativeSelect>
      </FormControl>
      {/* Display ranking */}
      <DisplayRankings rankType={rankType} category={rankingData[state.activeCat]} />
    </Box>
  );
};

const PageClient = () => {
  const [state, setState] = React.useState({
    rankType: GameRoomRankingEnum.TODAY,
  });

  const handleRanking = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    val: GameRoomRankingEnum
  ) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, rankType: val, page: 1 }));
  };

  return (
    <Box>
      <Container>
        <PageHeader title="Games Leaderboard" />
        <Box sx={{ position: "relative", mt: 1 }}>
          <Box sx={{display: "flex", justifyContent: "flex-end", my: 1}}>
            <Button color="warning" variant="outlined" LinkComponent={Link} href="leaderboard-archive">View Archive</Button>
          </Box>
          <Paper sx={{ p: 2 }}>
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
                      color: (theme) =>
                        theme.vars.palette.gradient.contrastText,
                    }),
                    "&:hover": {
                      background: (theme) => theme.vars.palette.gradient[200],
                      color: (theme) =>
                        theme.vars.palette.gradient.contrastText,
                      transition: "2s ease-out",
                    },
                  }}
                  onClick={(ev) => handleRanking(ev, item.value)}
                >
                  {item.title}
                </Button>
              ))}
            </Stack>

            <DisplayComponent rankType={state.rankType} />
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default PageClient;
