"use client";
import * as React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  Container,
  NativeSelect,
  Pagination,
  Paper,
  Skeleton,
  Stack,
} from "@mui/material";
import { GameWinnersStats } from "@/types";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import { PageHeader, SkeletonTable } from "@/components/common";
import { getGameWinners, getGameWinnersStats } from "@/lib/games";
import useSWR from "swr";
import { getErrorMessage, monthNames } from "@/utils";
import WinnersTable from "./WinnersTable";
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
    getGameWinners(arg.query, arg.token),
  { errorRetryCount: 1}
  );
  if(isLoading && !data){
    return (<SkeletonTable rows={2} />)
  }
  if((error && !data) || !data){
    return (<Typography sx={{py: 1, textAlign: "center"}}>{error.status === 404 ? "No data yet" :getErrorMessage(error)}</Typography>)
  }
  return (
    <WinnersTable
      title="Leaderboard"
      winners={data}
      currentUserId={currentUserId}
    />
  );
}

const getPaginationCount = (total: number) => {
  return Math.ceil(total / ITEM_PER_PAGE);
};

const DisplayWinners = ({
  winnersStats,
}: {
  winnersStats: GameWinnersStats[];
}) => {

  console.log("winnersStats ", winnersStats)
  const { token, user } = useAuthSession();

  const firstItem = winnersStats[0];

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
      rewardStats: item.rewardStats,
    }));
    // const months = winnersStats
    //   .filter((item) => item.year === initData.year)
    //   .map((item) => ({ month: item.month, name: monthNames[item.month] }));
    // // get categories
    // const categories = winnersStats
    //   .filter((item) => item.year === initData.year)
    //   .map((item) => ({ id: item.catId, name: item.name }));
    return {
      stats: firstItem,
      year: firstItem.year,
      month: months[0].month,
      catId: categories[0].id,
      category: categories[0],
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
        const yearStats = winnersStats.find((item) => item.year === val);
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
          rewardStats: item.rewardStats,
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
        const yearStats = winnersStats.find((item) => item.year === state.year);
        if (!yearStats) return;
        // get categories
        const monthStats = yearStats.stats.find((item) => item.month === val);
        if (!monthStats) return;
        const categories = monthStats.categories.map((item) => ({
          id: item.cat.id,
          name: item.cat.name,
          game: item.cat.game,
          rewardStats: item.rewardStats,
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
        const yearStats = winnersStats.find((item) => item.year === state.year);
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
            rewardStats: category.rewardStats,
          },
        }));
      }
    }

  // const handleChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
  //   if (ev.target.name === "year") {
  //     const val = Number(ev.target.value);
  //     const yearStats = winnersStats.filter((item) => item.year === val);
  //     // get months
  //     const months = winnersStats
  //       .filter((item) => item.year === val)
  //       .map((item) => ({ month: item.month, name: monthNames[item.month] }));
  //     // get categories
  //     const categories = winnersStats
  //       .filter((item) => item.year === val)
  //       .map((item) => ({ id: item.catId, name: item.name }));
  //     // compose obj
  //     const obj = {
  //       year: Number(val),
  //       months,
  //       categories,
  //       month: months[0].month,
  //       catId: yearStats[0].id,
  //       stats: yearStats[0],
  //     };
  //     // update state
  //     setState((prev) => ({
  //       ...prev,
  //       ...obj,
  //       page: prev.year === val ? prev.page : 1,
  //     }));
  //   }
  //   else{
  //     setState((prev) => ({...prev, [ev.target.name]: ev.target.value}));
  //   }
    
  // };

  const totalPages = getPaginationCount(
    Number(state?.category?.rewardStats?.rewardParticipants ?? 0 ));

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
            {winnersStats.map((item) => (
              <option key={item.year} value={item.year}>
                {item.year}
              </option>
            ))}
          </NativeSelect>
          {/* <Select
            labelId="demo-select-year-label"
            id="demo-select-year"
            value={state.year}
            label="Year"
            name="year"
            onChange={(ev) => handleChange(ev)}
          >
            {winnersStats.map((item) => (
              <MenuItem key={nanoid()} value={item.year}>
                {item.year}
              </MenuItem>
            ))}
          </Select> */}
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
          {/* <Select
            labelId="demo-select-month-label"
            id="demo-select-month"
            value={state.month}
            label="Month"
            name="month"
            onChange={(ev) => handleChange(ev)}
          >
            {/* <MenuItem value="">
              <em>None</em>
            </MenuItem> */}
            {/* {state.months.map((item) => (
              <MenuItem key={nanoid()} value={item.month}>
                {item.name}
              </MenuItem>
            ))}
          </Select> */}
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
            {state.categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </NativeSelect>
        </FormControl>
          {/* <Select
            labelId="demo-select-week-label"
            id="demo-select-week"
            value={state.catId}
            label="Week"
            name="week"
            onChange={(ev) => handleChange(ev)}
          >
            {state.categories.map((item) => (
              <MenuItem key={nanoid()} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </Select> */}
      </Stack>
      {/* display winners */}
      <Typography
        variant="caption"
        sx={{
          py: "1px",
          fontFamily: "PlayFair",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {state?.category?.game?.name} - {state?.category?.name} - Previous Winners
      </Typography>
      <div style={{ display: "none" }}>
        <PlayerPage
          currentUserId={user.id}
          token={token}
          query={`type=winners&catId=${
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
          query={`type=winners&catId=${state.catId}&limit=${ITEM_PER_PAGE}&year=${state.year}&month=${state.month}&page=${state.page}`}
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
    data: winnersStats,
    isLoading,
    error,
  } = useSWR({type: "winners-stats", token }, (key) => getGameWinnersStats(key.token));

console.log("winnersStats ", winnersStats)
  return (
    <Container maxWidth="xl">
      <PageHeader title="Past Winners" />
      <Box>
        <Box sx={{ position: "relative", mt: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ my: 2 }}>
              {(isLoading && !winnersStats) && 
              (<Box>
                <DropdownSkeleton />
                <SkeletonTable />
              </Box>)  }
              {error && <Typography>{getErrorMessage(error)}</Typography>}
              {winnersStats && <DisplayWinners winnersStats={winnersStats} />}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default PageClient;
