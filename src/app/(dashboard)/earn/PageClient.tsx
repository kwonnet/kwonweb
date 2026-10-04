"use client";
import React from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import PageHeader from "@/components/common/PageHeader";
import { nanoid } from "nanoid";
import { Slide } from "react-awesome-reveal";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import VideoIcon from "@mui/icons-material/VideoLibraryOutlined";
import { useRouter } from "next/navigation";

const items = [
  {
    id: nanoid(),
    title: "Play Games",
    url: "/games",
    icon: <SportsEsportsIcon fontSize="large" />,
    delay: 400,
    bg: "500",
  },
  {
    id: nanoid(),
    title: "Go Live",
    url: "/live",
    icon: <LiveTvOutlinedIcon fontSize="large" />,
    delay: 400,
    bg: "500",
  },
  {
    id: nanoid(),
    title: "Contests",
    url: "/contests",
    icon: <EmojiEventsOutlinedIcon fontSize="large" />,
    delay: 400,
    bg: "500",
  },
  {
    id: nanoid(),
    title: "Challenges",
    url: "/challenges",
    icon: <EmojiEventsOutlinedIcon fontSize="large" />,
    delay: 400,
    bg: "500",
  },
  {
    id: nanoid(),
    title: "Online Survey",
    url: "/surveys",
    icon: <EmojiEventsOutlinedIcon fontSize="large" />,
    delay: 400,
    bg: "500",
  },
  {
    id: nanoid(),
    title: "Watch & Earn",
    url: "/watch-videos",
    icon: <VideoIcon fontSize="large" />,
    delay: 400,
    bg: "500",
  },
];

const PageClient = () => {
  const router = useRouter();

  const handleClick = async (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
    url: string
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    router.push(url);
  };

  return (
    <Container maxWidth="xl">
      <PageHeader title="Ways To Earn" />
      <Box sx={{ p: 2, position: "relative" }}>
        <Grid container spacing={1}>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <Grid size={{ lg: 4, md: 4, sm: 6, xs: 6 }} key={item.id}>
                <Slide direction="down" delay={item.delay}>
                  <Card
                    raised
                    onClick={(ev) => handleClick(ev, item.url)}
                    sx={[
                      (theme) => ({
                        boxShadow:
                          "4px 4px 10px rgba(0, 0, 0, 0.2), -4px -4px 10px rgba(3, 29, 55, 0.1)",
                        borderRadius: 2,
                        overflow: "hidden",
                        position: "relative",
                        height: "150px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        textDecoration: "none",
                        ...theme.applyStyles("dark", {
                          background: theme.vars.palette.grey[900],
                        }),
                      }),
                    ]}
                  >
                    <Box
                      sx={[
                        (theme) => ({
                          position: "absolute",
                          top: -20,
                          right: -20,
                          width: 100,
                          height: 100,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(0, 0, 0, 0.05)",
                          color: "rgba(0, 0, 0, 0.1)",
                          ...theme.applyStyles("dark", {
                            background: "rgba(0, 0, 0, 0.15)",
                            color: theme.vars.palette.grey[800],
                          }),
                        }),
                      ]}
                    >
                      {item.icon}
                    </Box>
                    <CardContent>
                      <Typography
                        sx={{ fontFamily: "PlayFair" }}
                        variant="h6"
                        align="center"
                      >
                        {item.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </Slide>
              </Grid>
            </React.Fragment>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default PageClient;
