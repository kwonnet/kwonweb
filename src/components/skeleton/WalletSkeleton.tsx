import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Divider,
  Skeleton,
  Button,
} from "@mui/material";

const WalletSkeleton = () => {
  return (
    <Box sx={{ clear: "right", pt: 4 }}>
      <Paper
        sx={[
          (theme) => ({
            py: 2,
            px: 4,
            background: theme.vars.palette.gradient[300],
            color: theme.vars.palette.gradient.contrastText,
            ...theme.applyStyles("dark", {
              background: theme.vars.palette.grey[900],
            }),
          }),
        ]}
      >
        <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
          <Skeleton width={80} />
        </Typography>
        {/* credit section */}
        <Box sx={{ py: 1 }}>
          <Typography
            variant="h4"
            component="h3"
            sx={{ fontFamily: "PlayFair", py: 1, fontStyle: "italic" }}
          >
            <Skeleton width={100} />
          </Typography>
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
            spacing={1}
          >
            <Box>
              <Stack
                direction="row"
                sx={{ alignItems: "center" }}
                spacing={1}
              >
                <Skeleton width={60} height={40} />
                <Skeleton width={40} />
              </Stack>
            </Box>
            <Box>
              <Stack
                direction="row"
                sx={{ alignItems: "center" }}
                spacing={1}
              >
                <Skeleton width={60} height={40} />
                <Skeleton width={40} />
              </Stack>
            </Box>
          </Stack>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Skeleton variant="rectangular" width={100} height={36} />
          </Box>
        </Box>
        <Divider
          variant="fullWidth"
          sx={{
            border: (theme) => `1px solid ${theme.palette.tints[100]}`,
          }}
        />
        {/* Coins */}
        <Box sx={{ py: 1 }}>
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
            spacing={1}
          >
            <Typography
              variant="h4"
              component="h3"
              sx={{ fontFamily: "PlayFair", fontStyle: "italic" }}
            >
              <Skeleton width={100} />
            </Typography>
            <Stack direction="row" sx={{ alignItems: "center" }}>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton width={60} />
            </Stack>
          </Stack>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Skeleton variant="rectangular" width={100} height={36} />
          </Box>
        </Box>
        <Divider
          variant="fullWidth"
          sx={{
            border: (theme) => `1px solid ${theme.palette.tints[100]}`,
          }}
        />
        {/* Bonus section */}
        <Box sx={{ pb: 1 }}>
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
            spacing={1}
          >
            <Typography
              variant="h4"
              component="h3"
              sx={{ fontFamily: "PlayFair", fontStyle: "italic" }}
            >
              <Skeleton width={100} />
            </Typography>
            <Stack direction="row" sx={{ alignItems: "center" }}>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton width={60} />
            </Stack>
          </Stack>
        </Box>
      </Paper>
      {/* history section */}
      <Typography
        sx={{
          py: 1,
          textAlign: "center",
          fontWeight: "bold",
          fontFamily: "PlayFair",
        }}
        variant="h4"
      >
        <Skeleton width="50%" />
      </Typography>
    </Box>
  );
};

export default WalletSkeleton;
