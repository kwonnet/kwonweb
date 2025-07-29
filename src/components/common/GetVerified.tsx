'use client'
import { useAuthSession } from "@/hooks";
import { Box, Button, Grid, Paper, Typography } from "@mui/material";
import Link from "next/link";
import React from "react";

const GetVerified = () => {

    const {user} = useAuthSession()
  
  return (
    <Paper
      sx={[
        (theme) => ({
          // my: 2,
          borderRadius: 3,
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.2)",
          minHeight: 80,
          width: "100%",
          px: 1,
          py: 2,
          background: theme.vars.palette.gradient[200],
          color: theme.vars.palette.gradient.contrastText,
          ...theme.applyStyles("dark", {
            background: theme.vars.palette.grey[900]
          }),
        }),
      ]}
      elevation={4}
    >
      <Grid
        container
        spacing={1}
        sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}
      >
        <Grid size={{ lg: 10, xs: 9 }}>
          <Box>
            <Typography sx={{ fontFamily: "PlayFair" }} variant="body1">
              {user.meta.isPro ? "Earn More Coins" : "Get Verification Badge" }
            </Typography>
            <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
            {user.meta.isPro ? "Invite your friends to earn more coins!" : "Enjoy exclusive offer with a pro plan" }
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ lg: 2, xs: 3 }}>

          <Button
            sx={{
              borderRadius: 5,
            }}
            size="small"
            variant="outlined"
            color="inherit"
            LinkComponent={Link}
            href={user.meta.isPro ? "/invite" : "/subscribe"}
          >
            { user.meta.isPro ? "Invite" : "Upgrade"}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default GetVerified;
