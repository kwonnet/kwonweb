"use client";
import PageHeader from "@/components/common/PageHeader";
import { Game } from "@/types";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";
import { Fade } from "react-awesome-reveal";

const GameCard = ({ game }: { game: Game }) => {
  const router = useRouter()
  const handleClick = () => {
    router.push(`/games/${game.id}?g_n=${game.name}`)
  }
  return (
    <Card
      onClick={() => handleClick()}
      raised
      sx={[
        (theme) => ({
          p: 1,
          mb: 1,
          cursor: "pointer",
          height: "100%",
          // background: theme.vars.palette.gradient[700],
          // color: theme.vars.palette.gradient.contrastText,
          ...theme.applyStyles("dark", {
            background: theme.vars.palette.grey[900],
          }),
        }),
      ]}
    >
      
        <CardContent>
          <Typography
            sx={{ fontFamily: "PlayFair", fontWeight: "bold" }}
            variant="h6"
          >
            {game.name}
          </Typography>
          <Typography
            sx={{ fontFamily: "PlayFair", fontWeight: "bold" }}
            variant="caption"
          >
            {game.description}
          </Typography>
        </CardContent>
    </Card>
  );
};
const PageClient = ({ games }: { games: Game[] }) => {
  return (
    <Box>
      <Container maxWidth="xl">
        <PageHeader title="All Games" />
        <Fade cascade>
          <Grid container spacing={2}>
            {games.map((game) => (
              <Grid size={{ lg: 4, md: 4, sm: 12, xs: 12 }} key={game.id}>
                <GameCard game={game} />
              </Grid>
            ))}
          </Grid>
        </Fade>
      </Container>
    </Box>
  );
};

export default PageClient;
