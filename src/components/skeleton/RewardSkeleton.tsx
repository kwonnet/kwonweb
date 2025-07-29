import React from "react";
import { Paper, Stack, Box, Skeleton } from "@mui/material";

const RewardSkeleton = () => {
  return (
    <Paper sx={{ my: 1 }}>
      <Stack direction={"row"} sx={{ justifyItems: "center" }} spacing={1}>
        <Box sx={{ p: 1 }}>
          {/* Skeleton for the image */}
          <Skeleton
            variant="rectangular"
            sx={{ height: 120, width: 120, borderRadius: 5 }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          {/* Skeleton for the title */}
          <Skeleton variant="text" sx={{ fontWeight: "bold", fontSize: "1rem", width: "60%" }} />
          {/* Skeleton for the subtitle */}
          <Skeleton variant="text" sx={{ fontSize: "0.8rem", width: "40%" }} />
          {/* Skeleton for the description */}
          <Skeleton variant="text" sx={{ fontSize: "1rem", width: "90%" }} />
          <Skeleton variant="text" sx={{ fontSize: "1rem", width: "75%" }} />
        </Box>
      </Stack>
    </Paper>
  );
};

export default RewardSkeleton;
