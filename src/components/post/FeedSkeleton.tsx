"use client";
import { Box, Card, Skeleton, Stack, IconButton } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const FeedSkeleton = ({rows = 8, items = 6, height = 200}: {rows?:number; height?: number; items?: number}) => {
  return (
    <Box sx={{ mt: 1, maxHeight: "100dvh", overflow: "hidden", }}>
      {[...Array(rows)].map((_, index) => (
        <Card
          key={index}
          sx={(theme) => ({
            borderRadius: 0,
            mt: 0,
            mb: 0,
            pt: 0,
            pb: 0,
            my: 1,
            borderBottom: `0.1px solid #eaeaec`,
            ...theme.applyStyles("dark", {
              borderBottom: `0.1px solid #2b2a30`,
            }),
          })}
        >
          <Stack direction={"row"} sx={{ justifyContent: "space-between", p: 2 }}>
            <Stack direction={"row"} sx={{ alignItems: "center" }}>
              <Skeleton variant="circular" width={45} height={45} />
              <Stack sx={{ ml: 1 }}>
                <Skeleton variant="text" width={120} height={20} />
                <Skeleton variant="text" width={80} height={15} />
              </Stack>
            </Stack>
            <IconButton color="inherit">
              <MoreVertIcon color="disabled" />
            </IconButton>
          </Stack>

          <Box sx={{ p: 2 }}>
            <Skeleton variant="text" width="90%" height={20} />
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="rectangular" width="100%" height={height} sx={{ mt: 1 }} />
          </Box>

          <Stack direction={"row"} sx={{ justifyContent: "space-between", p: 2 }}>
            {[...Array(items)].map((_, idx) => (
              <Skeleton key={idx} variant="circular" width={24} height={24} />
            ))}
          </Stack>
        </Card>
      ))}
    </Box>
  );
};

export default FeedSkeleton;
