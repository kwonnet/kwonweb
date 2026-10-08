"use client";
import * as React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  Button,
  Container,
  Grid,
  NativeSelect,
  Pagination,
  Paper,
  Skeleton,
  Stack,
} from "@mui/material";
import { GameCategoryRanking, GameMode, GameRoomRankingEnum, GamePlayer } from "@/types";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import PageHeader from "@/components/common/PageHeader";
import SkeletonTable from "@/components/common/SkeletonTable";
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

const modeBtns = [
  { title: "Single", value: GameMode.SINGLE },
  { title: "Multi", value: GameMode.MULTI },
];

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

type InitialLeaderboardPage = { query: string; data: GamePlayer[] };
const ITEM_PER_PAGE = 15;

function PlayerPage({
  query,
  currentUserId,
  initialPage,
}: {
  query: string;
  currentUserId: string;
  initialPage?: InitialLeaderboardPage;
}) {
  const { token } = useAuthSession();

  const { data, isLoading } = useSWR({ query, token }, getSwrPlayers, { fallbackData: initialPage?.query === query ? initialPage.data : undefined, revalidateOnMount: initialPage?.query !== query });

  if (!data) return <SkeletonTable rows={2} />;

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
  mode,
  initialPage,
}: {
  rankType: GameRoomRankingEnum;
  category: GameCategoryRanking;
  mode: string;
  initialPage?: InitialLeaderboardPage;
}) => {
  const { user } = useAuthSession();

  const [state, setState] = React.useState({ page: 1 });

  const handleFetch = (ev: any, page: number) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, page }));
  };

  const totalPages = getPaginationCount(category?.totalParticipants ?? 1);

  return (
    <React.Fragment>
      <div style={{ display: "none" }}>
        <PlayerPage
          initialPage={initialPage}
          currentUserId={user.id}
          query={`/v1/games/leaderboard?type=board-archive&ranking=${rankType}&mode=${mode}&catId=${
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
          initialPage={initialPage}
          currentUserId={user.id}
          query={`/v1/games/leaderboard?type=board-archive&ranking=${rankType}&mode=${mode}&catId=${category.id}&limit=${ITEM_PER_PAGE}&page=${state.page}`}
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


const PageClient = ({ initialRankings, initialPage }: { initialRankings?: GameCategoryRanking[]; initialPage?: InitialLeaderboardPage }) => {
  const [state, setState] = React.useState({
    rankType: GameRoomRankingEnum.TODAY,
    mode: GameMode.SINGLE,
    activeCat: 0,
    page: 1,
  });

  const handleRanking = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    val: GameRoomRankingEnum
  ) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, rankType: val, page: 1 }));
  };

  const handleMode = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    val: GameMode
  ) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, mode: val, page: 1 }));
  };

  const { token, user } = useAuthSession();

  const dateInfo = getCurrentDataInfo();

  const { data, isLoading } = useSWR(
    {
      type: "categories-ranking",
      params: { rankType: state.rankType, mode: state.mode?.toLowerCase() },
      token,
    },
    (arg) => getGameCategoriesRankings(arg.params, arg.token),
    { fallbackData: state.rankType === GameRoomRankingEnum.TODAY && state.mode === GameMode.SINGLE ? initialRankings : undefined, revalidateOnMount: initialRankings === undefined || state.rankType !== GameRoomRankingEnum.TODAY || state.mode !== GameMode.SINGLE }
  );

  const isEmptyData = !data || data?.length === 0;

  if (isLoading && !data) {
    return <SkeletonStats />;
  }

  const rankingData = data ? data : []

  const category = rankingData[state.activeCat]

  return (
    <Box>
      <Container>
        <PageHeader title="Games Leaderboard" />
        <Box sx={{ position: "relative", mt: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", my: 1 }}>
            <Button
              color="warning"
              variant="outlined"
              LinkComponent={Link}
              href="leaderboard-archive"
            >
              View Archive
            </Button>
          </Box>

          <Paper sx={{ p: 2 }}>
            <Grid container>
              <Grid size={{ lg: 4, md: 4, sm: 12, xs: 12 }}>
                <Stack
                  direction="row"
                  sx={{
                    // justifyContent: "center",
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
                        // borderRadius: 30,
                        ...(state.rankType === item.value && {
                          background: (theme) =>
                            theme.vars.palette.gradient[200],
                          color: (theme) =>
                            theme.vars.palette.gradient.contrastText,
                        }),
                        "&:hover": {
                          background: (theme) =>
                            theme.vars.palette.gradient[200],
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
              </Grid>
              <Grid size={{ lg: 4, md: 4, sm: 12, xs: 12 }}>
                <Stack
                  direction="row"
                  sx={{
                    // justifyContent: "center",
                    mb: 1,
                    width: "100%",
                    zIndex: 9,
                  }}
                  spacing={2}
                >
                  {modeBtns.map((item) => (
                    <Button
                      key={item.title}
                      variant="outlined"
                      size="small"
                      color="inherit"
                      sx={{
                        // marginY: 1,
                        height: "100%",
                        boxShadow: 5,
                        // borderRadius: 30,
                        ...(state.mode === item.value && {
                          background: (theme) =>
                            theme.vars.palette.gradient[200],
                          color: (theme) =>
                            theme.vars.palette.gradient.contrastText,
                        }),
                        "&:hover": {
                          background: (theme) =>
                            theme.vars.palette.gradient[200],
                          color: (theme) =>
                            theme.vars.palette.gradient.contrastText,
                          transition: "2s ease-out",
                        },
                      }}
                      onClick={(ev) => handleMode(ev, item.value)}
                    >
                      {item.title}
                    </Button>
                  ))}
                </Stack>
              </Grid>
              <Grid size={{ lg: 4, md: 4, sm: 12, xs: 12 }}>
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
              </Grid>
            </Grid>

            <Box sx={{ py: 0, display: "block", textAlign: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 900 }}>
                Ranking -{" "}
                {state.rankType === GameRoomRankingEnum.TODAY
                  ? `${dateInfo.day} ${monthNames[dateInfo.month]} - ${dateInfo.year}`
                  : state.rankType === GameRoomRankingEnum.WEEK
                    ? `Week ${dateInfo.week} - ${monthNames[dateInfo.month]} - ${dateInfo.year}`
                    : `${monthNames[dateInfo.month]} - ${dateInfo.year}`}
              </Typography>
            </Box>

            {/* Display ranking */}
            {isEmptyData ? (
              <Box>
                <Typography sx={{textAlign: 'center', py: 1}}>
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
            ) : category ? (
              <DisplayRankings
                initialPage={initialPage}
                rankType={state.rankType}
                category={category}
                mode={state.mode}
              />
            ): <Typography sx={{textAlign: 'center', py: 1}}>No data available for this category - {state?.mode?.toLowerCase()} - {state.rankType} </Typography>}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default PageClient;
