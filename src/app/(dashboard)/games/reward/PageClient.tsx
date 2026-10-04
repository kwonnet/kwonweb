"use client";
import {
  Box,
  Container,
} from "@mui/material";
import React, {  } from "react";
import PageHeader from "@/components/common/PageHeader";
import useSWR from "swr";
import { getUserTaskSettings } from "@/lib/swrHooks";
import PageSkeleton from "./PageSkeleton";
import DailyBonus from "./DailyBonus";
import WatchAds from "./WatchAds";
import { useAuthSession } from "@/hooks";


const PageClient = () => {

  const { token, user } = useAuthSession();

  const { data, isLoading, error } = useSWR(`/v1/users/${user.id}/task-settings`, (url) => getUserTaskSettings(url, token));

  if (!data && isLoading) return <PageSkeleton />;
  
  return (
    <Box>
      <Container maxWidth="xl">
        <PageHeader title="Earn Free Bonus Coins" />
        <Box
        >
          {/* {error && <Typography>{error.status === 404 ? "Not data yet" : getErrorMessage(error) }</Typography>} */}
          {<DailyBonus data={data} /> }
          {/* {<WatchAds data={data} /> } */}
        </Box>
      </Container>
    </Box>
  );
};

export default PageClient;
