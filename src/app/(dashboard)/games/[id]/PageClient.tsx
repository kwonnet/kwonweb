"use client";
import { Box, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Fade } from "react-awesome-reveal";
import { Game, GameCategory, GameMode } from "@/types";

// type LocalGame = {
//   id: string;
//   name: string;
// };

const PageClient = ({
  categories,
  game,
}: {
  categories: GameCategory[];
  game: Game;
}) => {

  const [state, setState] = useState({mode: game.modes[0]})
  const router = useRouter();

  const handleClick = (item: GameCategory) => {
    router.push(`/games/rooms?c_i=${item.id}&c_n=${item.name}&c_m=${state.mode.toLowerCase()}`);
  };

  return (
    <Box>
      <Container maxWidth="xl">
        <PageHeader title={`Categories`} />
        <Box sx={{ mt: 1 }}>
          
          <Grid container spacing={2}>
            {game.modes.length > 1 && game.modes.map(mode => (
                <Grid size={6} key={mode}>
            <Paper
              onClick={() => setState(prev => ({...prev, mode}))}
              sx={[
                (theme) => ({
                  p: 1,
                  mb: 1,
                  cursor: "pointer",
                  height: "100%",
                  // boxShadow: 5,
                  // background: theme.vars.palette.gradient[700],
                  // color: theme.vars.palette.gradient.contrastText,
                  border: state.mode === mode ? `1px solid ${theme.vars.palette.info.dark}` : "none",
                  ...theme.applyStyles("dark", {
                    background: theme.vars.palette.grey[900],
                  }),
                }),
              ]}
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "PlayFair", fontWeight: "bold" }}
                >
                  {mode === GameMode.MULTI ? "Multiplayer" : "Single player"}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: "PlayFair" }}>
                  {mode === GameMode.MULTI ? "Compete against others in a game room" : "Play solo in a game room"}
                </Typography>
              </Box>
            </Paper>
            </Grid>
            )) }
          </Grid>
          <Box sx={{mt: 1}}>
            <Fade>
              <Grid container spacing={2}>
                {categories.map((item) => (
                  <Grid key={item.id} size={{ lg: 3, md: 3, sm: 12, xs: 12 }}>
                    <Paper
                      onClick={() => handleClick(item)}
                      sx={[
                        (theme) => ({
                          p: 1,
                          mb: 1,
                          cursor: "pointer",
                          height: "100%",
                          boxShadow: 5,
                          // background: theme.vars.palette.gradient[700],
                          // color: theme.vars.palette.gradient.contrastText,
                          ...theme.applyStyles("dark", {
                            background: theme.vars.palette.grey[900],
                          }),
                        }),
                      ]}
                    >
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontFamily: "PlayFair", fontWeight: "bold" }}
                        >
                          {item.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: "PlayFair" }}
                        >
                          {item.description}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Fade>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PageClient;
