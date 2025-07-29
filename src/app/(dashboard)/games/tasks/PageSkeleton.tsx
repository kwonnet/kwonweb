"use client";
import React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Skeleton,
} from "@mui/material";

const PageSkeleton = () => {
  return (
    <Box>
      <Container maxWidth="xl">
        <Box mb={4}>
          <Skeleton variant="text" width="50%" height={40} animation="wave" />
        </Box>

        {/* Spin Lucky Wheel Section */}
        <Box mb={4}>
          <Paper
            sx={(theme) => ({
              p: 2,
              mb: 1,
              ...theme.applyStyles("dark", {
                background: theme.vars.palette.grey[900],
              }),
            })}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: "PlayFair", fontWeight: "bold", mb: 2 }}
            >
              <Skeleton variant="text" width="60%" animation="wave" />
            </Typography>
            <Skeleton
              variant="circular"
              width={120}
              height={120}
              animation="wave"
            />
          </Paper>
        </Box>

        {/* Watch Ads Section */}
        <Box>
          <Paper
            sx={(theme) => ({
              p: 2,
              mb: 1,
              ...theme.applyStyles("dark", {
                background: theme.vars.palette.grey[900],
              }),
            })}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: "PlayFair", fontWeight: "bold", mb: 2 }}
            >
              <Skeleton variant="text" width="70%" animation="wave" />
            </Typography>
            <Skeleton
              variant="rectangular"
              width={120}
              height={40}
              animation="wave"
            />
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default PageSkeleton;
