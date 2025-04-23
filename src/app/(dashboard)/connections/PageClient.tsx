"use client";
import React, { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";

import { useAuthSession } from "@/hooks";
import { ConnTypeEnum } from "@/types";

const connTypes = [
  {
    id: ConnTypeEnum.SUGGESTED,
    name: "Suggested Accounts",
  },
  {
    id: ConnTypeEnum.MUTUAL_FOLLOWS,
    name: "You may know",
  },
  {
    id: ConnTypeEnum.NEAR_YOU,
    name: "Near you",
  },
  {
    id: ConnTypeEnum.POPULAR_CREATORS,
    name: "Popular creators",
  },
  {
    id: ConnTypeEnum.INTEREST,
    name: "Your interests",
  },
];

export default function PageClient({
  SuggestedServer,
  MutualFollowsServer,
  PopularCreatorsServer,
  InterestsServer,
  NearYouServer,
}: {
  SuggestedServer?: React.ReactNode;
  MutualFollowsServer?: React.ReactNode;
  PopularCreatorsServer?: React.ReactNode;
  InterestsServer?: React.ReactNode;
  NearYouServer?: React.ReactNode;
}) {
  const { user } = useAuthSession();

  const [state, setState] = useState({
    active: ConnTypeEnum.SUGGESTED,
  });

  const toggleFeedType = (active: ConnTypeEnum) => {
    setState((prev) => ({ ...prev, active }));
  };
  return (
    <Box sx={{ px: 1 }}>
      {/* Content for the left section */}
      <Box sx={{ width: "100wv", mb: 1 }}>
        <Stack
          direction="row"
          alignItems={"center"}
          justifyContent={"space-between"}
          spacing={0.5}
          sx={{ px: 1, py: 2, overflowX: "auto" }}
        >
          {connTypes.map((item) => (
            <Typography
              key={item.id}
              color={state.active === item.id ? "textPrimary" : "textDisabled"}
              sx={{
                //   fontWeight: state.active === item.id ? 600 : undefined,
                cursor: "pointer",
              }}
              onClick={(ev) => toggleFeedType(item.id)}
            >
              {item.name}
            </Typography>
          ))}
        </Stack>
      </Box>
      {state.active === ConnTypeEnum.SUGGESTED && SuggestedServer}
      {state.active === ConnTypeEnum.MUTUAL_FOLLOWS && MutualFollowsServer}
      {state.active === ConnTypeEnum.POPULAR_CREATORS && PopularCreatorsServer}
      {state.active === ConnTypeEnum.INTEREST && InterestsServer}
      {state.active === ConnTypeEnum.NEAR_YOU && NearYouServer}
    </Box>
  );
}
