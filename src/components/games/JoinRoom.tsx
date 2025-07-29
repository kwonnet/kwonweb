"use client";
import { Box, Button, Grid, Paper, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";

const JoinRoom = () => {

  const router = useRouter();

  const handleClick = async (url: string) => {
    router.push(url);
  };

  return (
    <Paper
      onClick={() => handleClick("/games")}
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
      <Grid container spacing={1}>
        <Grid size={{ lg: 8, xs: 9 }}>
          <Box>
            <Typography sx={{ fontFamily: "PlayFair" }} variant="body1">
              Your friends are waiting for you!
            </Typography>
            <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
              Join a room to compete with others
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ lg: 4, xs: 3 }}>
          <Button
            sx={{
              borderRadius: 30,
            }}
            size="small"
            variant="outlined"
            color="inherit"
          >
            Join
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default JoinRoom;
