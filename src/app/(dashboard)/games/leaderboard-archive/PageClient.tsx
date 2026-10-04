"use client";
import * as React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  Button,
  CircularProgress,
  Container,
  IconButton,
  NativeSelect,
  Pagination,
  Paper,
  Skeleton,
  Stack,
} from "@mui/material";
import { GameRankingArchiveStats } from "@/types";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import PageHeader from "@/components/common/PageHeader";
import SkeletonTable from "@/components/common/SkeletonTable";
import {
  getGameRankingArchiveStats,
  getGameCategoryRankingArchive,
} from "@/lib/games";
import useSWR from "swr";
import { getErrorMessage, monthNames } from "@/utils";
import PlayersTable from "./PlayersTable";
import { useAuthSession } from "@/hooks";

const DropdownSkeleton = () => (
  <Stack direction={"row"} spacing={2} sx={{ justifyContent: "space-between" }}>
    {/* Skeleton for Year Dropdown */}
    <Skeleton variant="rectangular" width="100%" height={40} sx={{ m: 1 }} />

    {/* Skeleton for Month Dropdown */}
    <Skeleton variant="rectangular" width="100%" height={40} sx={{ m: 1 }} />

    {/* Skeleton for Category Dropdown */}
    <Skeleton variant="rectangular" width="100%" height={40} sx={{ m: 1 }} />
  </Stack>
);

const ITEM_PER_PAGE = 15;

function PlayerPage({
  query,
  currentUserId,
  token,
}: {
  query: string;
  currentUserId: string;
  token?: string;
}) {
  const { data, isLoading, error } = useSWR({ query, token }, (arg) =>
    getGameCategoryRankingArchive(arg.query, arg.token),
  { errorRetryCount: 1}
  );
  if(isLoading && !data){
    return (<SkeletonTable rows={2} />)
  }
  if((error && !data) || !data || data?.length === 0){
    return (<Typography sx={{py: 1, textAlign: "center"}}>{error.status === 404 ? "No ranking data yet" :getErrorMessage(error)}</Typography>)
  }
  
  return (
    <PlayersTable
      title="Leaderboard"
      data={data}
      currentUserId={currentUserId}
    />
  );
}

const getPaginationCount = (total: number) => {
  return Math.ceil(total / ITEM_PER_PAGE);
};

const DisplayRankingArchieve = ({
  rankingStats,
}: {
  rankingStats: GameRankingArchiveStats[];
}) => {
  const { token, user } = useAuthSession();

  const firstItem = rankingStats[0];

  const [state, setState] = React.useState(() => {
    const months = firstItem.stats.map((item) => ({
      month: item.month,
      name: monthNames[item.month],
    }));
    // get categories
    const categories = firstItem.stats[0].categories.map((item) => ({
      id: item.cat.id,
      name: item.cat.name,
      game: item.cat.game,
      totalParticipants: item.totalParticipants,
    }));
    return {
      category: categories[0],
      year: firstItem.year,
      month: months[0].month,
      catId: categories[0].id,
      months,
      categories,
      page: 1,
    };
  });

  const handleFetch = (ev: any, page: number) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, page }));
  };

  const handleChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    if (ev.target.name === "year") {
      const val = Number(ev.target.value);
      const yearStats = rankingStats.find((item) => item.year === val);
      if (!yearStats) return;
      // get months
      const months = yearStats.stats.map((item) => ({
        month: item.month,
        name: monthNames[item.month],
      }));
      const categories = yearStats.stats[0].categories.map((item) => ({
        id: item.cat.id,
        name: item.cat.name,
        game: item.cat.game,
        totalParticipants: item.totalParticipants,
      }));
      // compose obj
      const obj = {
        year: Number(val),
        months,
        categories,
        month: months[0].month,
        catId: categories[0].id,
        category: categories[0],
      };
      // update state
      setState((prev) => ({
        ...prev,
        ...obj,
        page: prev.year === val ? prev.page : 1,
      }));
    } else if (ev.target.name === "month") {
      const val = Number(ev.target.value);
      const yearStats = rankingStats.find((item) => item.year === state.year);
      if (!yearStats) return;
      // get categories
      const monthStats = yearStats.stats.find((item) => item.month === val);
      if (!monthStats) return;
      const categories = monthStats.categories.map((item) => ({
        id: item.cat.id,
        name: item.cat.name,
        game: item.cat.game,
        totalParticipants: item.totalParticipants,
      }));
      setState((prev) => ({
        ...prev,
        [ev.target.name]: Number(ev.target.value),
        categories,
        catId: categories[0].id,
        category: categories[0],
      }));
    } else {
      const val = ev.target.value;
      const yearStats = rankingStats.find((item) => item.year === state.year);
      if (!yearStats) return;
      // get categories
      const monthStats = yearStats.stats.find(
        (item) => item.month === state.month
      );
      if (!monthStats) return;
      const category = monthStats.categories.find(
        (item) => item.cat.id === val
      );
      if (!category) return;
      setState((prev) => ({
        ...prev,
        [ev.target.name]: ev.target.value,
        catId: category.cat.id,
        category: {
          id: category.cat.id,
          name: category.cat.name,
          game: category.cat.game,
          totalParticipants: category.totalParticipants,
        },
      }));
    }
  };

  const totalPages = getPaginationCount(
    Number(state.category.totalParticipants)
  );

  return (
    <React.Fragment>
      <Stack
        direction={"row"}
        spacing={2}
        sx={{ justifyContent: "space-between" }}
      >
        <FormControl fullWidth sx={{ m: 1 }} size="small">
          <InputLabel id="year-label">Year</InputLabel>
          <NativeSelect
            inputProps={{
              name: "year",
              id: "year-label",
            }}
            variant="outlined"
            value={state.year}
            onChange={(ev) => handleChange(ev)}
          >
            {rankingStats.map((item) => (
              <option key={item.year} value={item.year}>
                {item.year}
              </option>
            ))}
          </NativeSelect>
        </FormControl>
        <FormControl fullWidth sx={{ m: 1 }} size="small">
          <InputLabel id="month-label">Month</InputLabel>
          <NativeSelect
            inputProps={{
              name: "month",
              id: "month-label",
            }}
            variant="outlined"
            value={state.year}
            onChange={(ev) => handleChange(ev)}
          >
            {state.months.map((item, index) => (
              <option key={item.month} value={item.month}>
                {item.name}
              </option>
            ))}
          </NativeSelect>
        </FormControl>
        <FormControl fullWidth sx={{ m: 1 }} size="small">
          <InputLabel id="cat-label">Category</InputLabel>
          <NativeSelect
            inputProps={{
              name: "catId",
              id: "cat-label",
            }}
            variant="outlined"
            value={state.catId}
            onChange={(ev) => handleChange(ev)}
          >
            {state.categories.map((item, index) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </NativeSelect>
        </FormControl>
      </Stack>
      {/* display ranking-archieve */}
      <Typography
        variant="caption"
        sx={{
          py: "1px",
          fontFamily: "PlayFair",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {state.category.game.name} - {state.category.name} - Ranking Archive
      </Typography>
      <div style={{ display: "none" }}>
        <PlayerPage
          currentUserId={user.id}
          token={token}
          query={`type=ranking-archieve&catId=${
            state.catId
          }&limit=${ITEM_PER_PAGE}&year=${state.year}&month=${
            state.month
          }&page=${state.page + 1 > totalPages ? state.page : state.page + 1}`}
        />
      </div>

      <Box
        sx={{
          paddingTop: 1,
          position: "relative",
          height: "100%",
          overflow: "auto",
        }}
      >
        <PlayerPage
          currentUserId={user.id}
          token={token}
          query={`type=ranking-archieve&catId=${state.catId}&limit=${ITEM_PER_PAGE}&year=${state.year}&month=${state.month}&page=${state.page}`}
        />
      </Box>
      <Box sx={{ position: "relative" }}>
        {/* <Box sx={{position: "absolute", bottom: 3}}> */}
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
        {/* </Box> */}
      </Box>
    </React.Fragment>
  );
};

const PageClient = () => {
  const { token } = useAuthSession();

  const {
    data: rankingStats,
    isLoading,
    error,
  } = useSWR({ type: "archive-stats", token }, (key) =>
    getGameRankingArchiveStats(key.token)
  );
  return (
    <Container maxWidth="xl">
      <PageHeader title="Leaderboard Archive" />
      <Box>
        <Box sx={{ position: "relative", mt: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ my: 2 }}>
              {isLoading && !rankingStats && (
                <Box>
                  <DropdownSkeleton />
                  <SkeletonTable />
                </Box>
              )}
              {error && <Typography>{error.status === 404 ? "No data yet" :getErrorMessage(error)}</Typography>}
              {rankingStats && (
                <DisplayRankingArchieve rankingStats={rankingStats} />
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default PageClient;
