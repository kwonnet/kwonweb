"use client";
import { getSWRTxnHistory, useUserStats } from "@/lib/swrHooks";
import { Transaction } from "@/types";
import {
  checkSWRIsLoadingMore,
  checkSWRReachEnd,
  formatDateTime,
  formatNumberWithCommas,
  getSWRData,
} from "@/utils";
import React, { useEffect, useState } from "react";
import useSWRInfinite from "swr/infinite";
import _debounce from "lodash/debounce";
import { Box, Button, Grid, Paper, Stack, Typography } from "@mui/material";
import { Fade } from "react-awesome-reveal";
import { useAuthSession } from "@/hooks";

type GroupedRecord = {
  day: string;
  items: Transaction[];
};

function groupRecordsByDay(records: Transaction[]): GroupedRecord[] {
  const grouped: { [key: string]: GroupedRecord } = {};

  records.forEach((record) => {
    // Convert the date string to a Date object
    const date = new Date(record.createdAt);
    // Format the day string
    const day = date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      weekday: "long",
    });

    // Ensure the group exists
    if (!grouped[day]) {
      grouped[day] = {
        day,
        items: [record],
      };
    } else {
      // Add the current record to the group, omitting the createdAt field
      grouped[day].items.push(record);
    }
  });

  // Convert the grouped object into an array
  return Object.values(grouped);
}

const DisplayTxnHistory = ({ data }: { data: GroupedRecord }) => {
  return (
    <React.Fragment>
      <Typography
        sx={{ color: (theme) => theme.vars.palette.tints[500] }}
        variant="body2"
        py={1}
      >
        {data.day}
      </Typography>
      <Grid container spacing={2}>
        {data.items.map((txn) => (
          <Grid
            key={txn.id}
            size={{ lg: 12, md: 12, sm: 12, xs: 12 }}
            id={txn.id}
          >
            <Fade>
              <Box
                sx={[
                  (theme) => ({
                    width: "100%",
                    height: "100%",
                    p: 1,
                    border: `0.5px solid ${theme.vars.palette.divider}`,
                    borderRadius: 2,
                    // background: theme.vars.palette.gradient[500],
                    // color: theme.vars.palette.gradient.contrastText,
                    // ...theme.applyStyles("dark", {
                    //   background: theme.vars.palette.grey[800],
                    // }),
                  }),
                ]}
              >
                <Stack
                  direction={"row"}
                  sx={{ alignItems: "center", justifyContent: "space-between" }}
                  spacing={0.5}
                >
                  <Box>
                  <Typography sx={{ fontFamily: "PlayFair" }} variant="body1">
                    {txn.description}
                  </Typography>
                  <Typography sx={{ fontFamily: "PlayFair", fontStyle: "italic", fontSize: "0.7rem", color: theme => theme.vars.palette.text.primary }} variant="caption">
                      {formatDateTime(txn.createdAt)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color={txn.type === "DEBIT" ? "error" : "success"}
                    sx={{ fontWeight: "bold", fontFamily: "PlayFair" }}
                  >
                    {txn.type === "DEBIT" ? "-" : ""}{" "}
                    {formatNumberWithCommas(txn.amount)} {txn.currency}
                  </Typography>
                </Stack>
              </Box>
            </Fade>
          </Grid>
        ))}
      </Grid>
    </React.Fragment>
  );
};
const TxnHistory = ({ refreshHistory }:{ refreshHistory?: boolean}) => {
  const [state, setState] = useState({ page: 1, limit: 20 });

  const { token, user } = useAuthSession();

  const { data: stats} = useUserStats({userId: user.id, token});

  // get keys for fetching data
  const getKey = (
    pageIndex: number,
    previousPageData: { data: Transaction[] | undefined; nextCursor: string }
  ) => {
    // if no user or reached the end, do not fetch
    if (previousPageData && !previousPageData.data) return null;
    // first page, we don't have `previousPageData`
    return {
      url: `/v1/wallets/history?limit=${state.limit}&page=${pageIndex + 1}`,
      type: "txnHistory",
    };
  };
  const { data, error, isLoading, isValidating, mutate, size, setSize } =
    useSWRInfinite(getKey, ({ url }) => getSWRTxnHistory(url));

  const txnHistoryData = getSWRData<Transaction>(data);

  const totalCurrentData = txnHistoryData.length;

  const isLoadingMore = checkSWRIsLoadingMore({ isLoading, size, data });

  const isReachingEnd = checkSWRReachEnd({
    error,
    data,
    pageSize: state.limit,
    totalCurr: totalCurrentData,
    total: stats?.totalTxns ?? state.limit,
  });

  useEffect(() => {
    if(refreshHistory) return
    mutate(data)
    return () => {}
  }, [refreshHistory])
  

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

  return (
    <Box maxWidth="xl">
      {groupRecordsByDay(txnHistoryData).map((item, index) => (
        <DisplayTxnHistory key={index} data={item} />
      ))}

      <Typography
        variant="h6"
        sx={{ textAlign: "center", fontFamily: "PlayFair", pt: 2 }}
      >
        Showing {totalCurrentData} of {stats?.totalTxns ?? 0} transaction(s){" "}
      </Typography>

      {!isReachingEnd && (
        <Box sx={{ py: 2, textAlign: "center", display: "block" }}>
          <Button
            disabled={isLoadingMore || isReachingEnd}
            loading={isLoadingMore}
            variant="contained"
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

export default TxnHistory;
