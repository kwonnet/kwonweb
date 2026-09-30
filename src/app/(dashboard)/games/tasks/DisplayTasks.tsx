"use client";
import { getTasks, useUserStats } from "@/lib/swrHooks";
import { Task, Transaction } from "@/types";
import {
  checkSWRIsLoadingMore,
  checkSWRReachEnd,
  getSWRData,
} from "@/utils";
import React, { useEffect, useState } from "react";
import useSWRInfinite from "swr/infinite";
import _debounce from "lodash/debounce";
import { Box, Button, Grid, Paper, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { CoinsSvgIcon } from "@/components/svg";
import KeyboardDoubleArrowRightOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowRightOutlined";
import TaskSkeleton from "./TaskSkeleton";
import { useAuthSession } from "@/hooks";

const DisplayTask = ({ data }: { data: Task[] }) => {
    const router = useRouter();

    const handleNavClick = (id: string) => {
        router.push(`/tasks/${id}`);
      };
      
  return (
    <React.Fragment>
      <Grid container spacing={1}>
            {data.map((task) => (
              <Grid size={{ lg: 4, md: 4, sm: 12, xs: 12 }} key={task.id}>
                <Paper
                  elevation={5}
                  sx={[
                    (theme) => ({
                      p: 2,
                      mb: 1,
                      cursor: "pointer",
                      ...theme.applyStyles("dark", {
                        background: theme.vars.palette.grey[900],
                      }),
                    }),
                  ]}
                  onClick={() => handleNavClick(task.id)}
                >
                  <Box>
                    <Typography>{task.title}</Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        sx={{ fontSize: "PlayFair" }}
                        variant="caption"
                      >
                        {task.description}{" "}
                      </Typography>
                      <KeyboardDoubleArrowRightOutlinedIcon sx={{ font: 12 }} />
                    </Box>
                    <Stack direction={"row"} sx={{ alignItems: "center" }}>
                      <CoinsSvgIcon style={{ fontSize: 16 }} />
                      <Typography color="warning">+{task.reward}</Typography>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
    </React.Fragment>
  );
};
const DisplayTasks = ({ refreshHistory }:{ refreshHistory?: boolean}) => {
  const [state, setState] = useState({ page: 1, limit: 20 });

  const { token, user } = useAuthSession();

  const stats = useUserStats({userId: user.id, token});

  // get keys for fetching data
  const getKey = (
    pageIndex: number,
    previousPageData: { data: Transaction[] | undefined; nextCursor: string }
  ) => {
    // if no user or reached the end, do not fetch
    if (previousPageData && !previousPageData.data) return null;
    // first page, we don't have `previousPageData`
    return {
      url: `/v1/tasks?limit=${state.limit}&page=${pageIndex + 1}`,
      type: "tasks",
    };
  };
  const { data, error, isLoading, isValidating, mutate, size, setSize } =
    useSWRInfinite(getKey, ({ url }) => getTasks(url), { errorRetryCount: 1});

  const taskData = getSWRData<Task>(data);

  const totalCurrentData = taskData.length;

  const isLoadingMore = checkSWRIsLoadingMore({ isLoading, size, data });

  const isReachingEnd = checkSWRReachEnd({
    error,
    data,
    pageSize: state.limit,
    totalCurr: totalCurrentData,
    total: stats?.data?.totalTaskNotDone ?? state.limit,
  });

  useEffect(() => {
    if(refreshHistory) return
    mutate()
    return () => {}
  }, [refreshHistory, mutate])
  

  const debounceFetch = React.useRef(
    _debounce(() => {
      setSize((prev) => prev + 1);
    }, 700)
  ).current;

  useEffect(() => {
    return () => {
      debounceFetch.cancel();
    };
  }, [debounceFetch]);

  const handleLoadMore = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    debounceFetch();
  };

  if(isLoading && !data){
    return <TaskSkeleton />
  }

  if(totalCurrentData === 0){
    return (
        <Box>
            <Typography sx={{ py: 1 }} variant="body2">
              No tasks at the moment
            </Typography>
        </Box>
    )
  }

  return (
    <Box>
          {totalCurrentData > 0 && (
            <Typography sx={{ py: 1 }} variant="body2">
              Hurry up & complete the tasks below to earn rewards
            </Typography>
          )}
          <DisplayTask data={taskData} />

      {!isReachingEnd && (
        <Box sx={{ py: 2, textAlign: "center", display: "block" }}>
          <Button
            disabled={isLoadingMore || isReachingEnd}
            loading={isLoadingMore}
            variant="outlined"
            color="warning"
            onClick={(ev) => handleLoadMore(ev)}
          >
            {isLoadingMore
              ? "Loading..."
              : isReachingEnd
              ? "No More Data"
              : "Load More"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default DisplayTasks;
