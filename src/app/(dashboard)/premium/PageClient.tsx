"use client";
import { getUserActiveSubscription } from "@/lib/users";
import { getErrorMessage } from "@/utils";
import { Box, Button, Container, Typography } from "@mui/material";
import React from "react";
import useSWR from "swr";
import PlanSkeleton from "./PlanSkeleton";
import DisplayItem from "./DisplayItem";
import { useAuthSession } from "@/hooks";
import Link from "next/link";
import { PageHeader } from "@/components/common";
import { Subscription } from "@/types";

const DisplayPage = ({ subscription }: { subscription?: Subscription }) => {
  // get auth user
  const { user, token } = useAuthSession();
  //   fetch active sub
  const { data, error, isLoading, mutate } = useSWR(
    { type: "pro", id: user.id, token },
    (arg) => getUserActiveSubscription(arg.id, arg.token),
    { errorRetryCount: 0, fallbackData: subscription }
  );

  const handleAction = () => {
    mutate();
  };

  if (isLoading && !data) return <PlanSkeleton />;

  if (!data) {
    const is404 = error.status === 404;
    return (
      <Box sx={{ textAlign: "center", pt: 4 }}>
        <Typography variant="h6">
          {is404 ? "You don't have any active plan" : getErrorMessage(error)}
        </Typography>
        {/* <Typography>{is404 && "Purchase a new plan"}</Typography> */}
        <Box sx={{ textAlign: "center", display: "block", py: 2 }}>
          <Button
            variant="outlined"
            LinkComponent={Link}
            href="/subscribe"
            color="info"
            sx={{borderRadius: 30, textTransform: "inherit"}}
          >
            Subscribe a plan
          </Button>
        </Box>
      </Box>
    );
  }

  return <DisplayItem data={data} handleAction={handleAction} />;
};

const PageClient = ({ subscription }: { subscription?: Subscription }) => {
  return (
    <Container maxWidth="xl">
      <PageHeader title="My Premium Plan" />
      <DisplayPage subscription={subscription} />
    </Container>
  );
};

export default PageClient;
