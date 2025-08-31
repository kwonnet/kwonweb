import React from "react";
import { Paper, Stack, Box, Skeleton, Grid } from "@mui/material";


const SkeletonCard = () => {
  return (
    <Paper sx={{ my: 1 }}>
      <Stack direction={"column"} sx={{ justifyItems: "center" }} spacing={1}>
        <Box sx={{ p: 1 }}>
          {/* Skeleton for the image */}
          <Skeleton
            variant="rectangular"
            sx={{ height: 150, width: "100%", }}
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

const items = Array.from({length: 20}).map((_, index) => index)


const ConnectionSkeleton = () => {
    return(
        <React.Fragment>
            <Grid container spacing={2}>
                {items.map(item => (
                <Grid key={item} size={{lg: 3, md: 3, sm: 12, xs: 12}}><SkeletonCard /></Grid>
            ))}
            </Grid>
        </React.Fragment>
    )
}

export default ConnectionSkeleton;
