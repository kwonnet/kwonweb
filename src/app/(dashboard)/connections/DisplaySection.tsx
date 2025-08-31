"use client";
import { FollowAction, UserConnection } from "@/types/user";
import { Box, Grid } from "@mui/material";
import React from "react";

import ConnectionCard from "./ConnectionCard";

const DisplaySection = ({
  items,
  onFollowUser,
}: {
  items: UserConnection[];
  onFollowUser: (connUser: UserConnection, action: FollowAction) => void;
}) => {
  return (
    <React.Fragment>
      <Box>
        <Grid container spacing={{ lg: 2, md: 2, sm: 0, xs: 0 }}>
          {items.map((item) => (
            <Grid key={item.id} size={{ lg: 3, md: 3, sm: 12, xs: 12 }}>
              <ConnectionCard item={item} onFollowUser={onFollowUser} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </React.Fragment>
  );
};

export default DisplaySection;
