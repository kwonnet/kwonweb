import React from "react";
import { Box, Paper, Grid, Stack, Skeleton } from "@mui/material";

const TaskSkeleton = () => {
  const skeletonArray = Array.from({ length: 6 });

  return (
    <React.Fragment>
      <Grid container spacing={1}>
        {skeletonArray.map((_, index) => (
          <Grid size={{lg: 4, md: 4, sm: 12, xs: 12}} key={index}>
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
            >
              <Box>
                {/* Title Skeleton */}
                <Skeleton variant="text" width="60%" />

                {/* Description Skeleton */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Skeleton variant="text" width="80%" />
                  <Skeleton
                    variant="circular"
                    width={16}
                    height={16}
                    sx={{ fontSize: 12 }}
                  />
                </Box>

                {/* Reward Skeleton */}
                <Stack direction={"row"} sx={{ alignItems: "center" }}>
                  <Skeleton
                    variant="circular"
                    width={16}
                    height={16}
                    sx={{ marginRight: 1 }}
                  />
                  <Skeleton variant="text" width="20%" />
                </Stack>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </React.Fragment>
  );
};

export default TaskSkeleton;
