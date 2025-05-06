import React from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Stack,
  Chip,
  Skeleton,
  Button,
} from "@mui/material";

const PlanSkeleton = () => {
  return (
    <Box>
      <Paper sx={{ py: 1, px: 2, justifyContent: "center" }}>
        {/* Title */}
        <Typography
          sx={{
            fontFamily: "PlayFair",
            fontStyle: "italic",
            textAlign: "center",
          }}
          variant="h3"
        >
          <Skeleton width="60%" />
        </Typography>
        <Divider sx={{ my: 1 }} />
        {/* Plan Name */}
        <Typography
          sx={{ fontFamily: "PlayFair", fontStyle: "italic" }}
          variant="h4"
        >
          <Skeleton width="40%" />
        </Typography>

        {/* Billing Cycle and Price */}
        <Box>
          <Stack spacing={1} direction={"row"} sx={{ alignItems: "center" }}>
            <Typography sx={{ fontFamily: "PlayFair" }} variant="subtitle1">
              <Skeleton width="30%" />
            </Typography>
            <Chip
              size="small"
              label={<Skeleton width="50px" />}
              sx={{ bgcolor: "grey.300" }}
            />
          </Stack>
          <Typography sx={{ fontFamily: "PlayFair" }} variant="h6">
            <Skeleton width="30%" />
          </Typography>
          <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
            <Skeleton width="50%" />
          </Typography>
        </Box>

        {/* Next Billing Cycle */}
        <Typography sx={{ fontFamily: "PlayFair" }} variant="h6">
          <Skeleton width="40%" />
        </Typography>
        <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
          <Skeleton width="60%" />
        </Typography>

        {/* Action Buttons */}
        <Stack
          direction={"row"}
          spacing={2}
          sx={{ justifyContent: "space-between", py: 2 }}
        >
          <Box sx={{ textAlign: "center", display: "block" }}>
            <Button variant="outlined" color="error" disabled>
              <Skeleton width="100px" />
            </Button>
          </Box>
          <Box sx={{ textAlign: "center", display: "block" }}>
            <Button variant="outlined" color="info" disabled>
              <Skeleton width="100px" />
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default PlanSkeleton;
