"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import { Button, CardMedia, Paper, Typography } from "@mui/material";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import useSWR from "swr";
import { getUserAchievements } from "@/lib/users";
import { RewardSkeleton } from "../skeleton";
import { GameAchievement } from "@/types";
import Link from "next/link";
import { useAuthSession } from "@/hooks";

const DisplayItem = ({ item }: { item: GameAchievement }) => {
  return (
    <Paper
      key={item.id}
      sx={{
        height: "100%",
        width: "100%",
        boxShadow: 5,
        borderRadius: 3,
        mb: 1,
        p: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        // "&:hover": {
        //   background: (theme) => theme.vars.palette.gradient[200],
        //   color: (theme) => theme.vars.palette.gradient.contrastText,
        //   transition: "2s ease-out",
        // },
      }}
    >
      <CardMedia
        height={80}
        component={"img"}
        src={item.thumbnail}
        sx={{ borderRadius: 3, width: "auto" }}
      />
      <Typography variant="caption" sx={{ fontFamily: "PlayFair" }}>
        {item?.reason?.replace(/_/g, " ")}
      </Typography>
    </Paper>
  );
};

export default function UserAchievements() {
  const { user, token } = useAuthSession();

  const { data, error, isLoading } = useSWR(
    { page: 1, limit: 10, userId: user.id },
    (query) => getUserAchievements(query, token)
  );

  const isError = !!(!data && error && !isLoading);

  const achievements = data ? data.data : [];

  if (isLoading && !data) {
    return <RewardSkeleton />;
  }

  if (achievements.length === 0) {
    return (
      <Box>
        <Typography variant="caption">
        Participate in a game to win cash reward & awards.
        </Typography>
        <Box sx={{ py: 1, textAlign: "center" }}>
          <Button
            variant="outlined"
            size="small"
            color="inherit"
            LinkComponent={Link}
            href="/games"
          >
            Play Game
          </Button>
        </Box>
      </Box>
    );
  }

  if (achievements.length === 1) {
    return achievements.map((item) => (
      <DisplayItem key={item.id} item={item} />
    ));
  }

  return (
    <Box>
      <Box sx={{}}>
        <Carousel
          arrows
          autoPlay={false}
          autoPlaySpeed={1000}
          className=""
          containerClass="container-with-dots"
          customTransition="all 1s linear"
          centerMode={true}
          dotListClass=""
          draggable
          focusOnSelect={false}
          infinite
          itemClass=""
          keyBoardControl
          minimumTouchDrag={80}
          pauseOnHover
          renderArrowsWhenDisabled={false}
          renderButtonGroupOutside={false}
          renderDotsOutside={false}
          responsive={{
            desktop: {
              breakpoint: {
                max: 3000,
                min: 1024,
              },
              items: 3,
              partialVisibilityGutter: 40,
              slidesToSlide: 4,
            },
            tablet: {
              breakpoint: {
                max: 1024,
                min: 464,
              },
              items: 2,
              partialVisibilityGutter: 30,
              slidesToSlide: 2,
            },
            mobile: {
              breakpoint: {
                max: 464,
                min: 0,
              },
              items: 1,
              partialVisibilityGutter: 30,
              slidesToSlide: 1,
            },
          }}
          rewind={false}
          rewindWithAnimation={false}
          rtl={false}
          shouldResetAutoplay
          showDots={false}
          sliderClass=""
          swipeable
          transitionDuration={1000}
          additionalTransfrom={-32 * 3}
        >
          {achievements.map((item) => (
            <DisplayItem key={item.id} item={item} />
          ))}
        </Carousel>
      </Box>
    </Box>
  );
}
