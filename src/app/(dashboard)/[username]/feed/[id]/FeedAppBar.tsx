"use client";
import { ArrowBackIosNewOutlined, HomeOutlined } from "@mui/icons-material";
import { IconButton, Paper, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";
import StickyBox from "react-sticky-box";

const FeedAppBar = () => {
  const router = useRouter();
  const handleGoBack = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.preventDefault();
    router.back()
  };
  return (
    <React.Fragment>
      <StickyBox className="post_appbar" style={{ zIndex: 99 }}>
        <Paper
          sx={{
            mt: 0,
            borderRadius: 0,
            py: 1.5,
            mb: 1,
            width: "100%",
            position: {
              lg: "relative",
              md: "relative",
              sm: "absolute",
              xs: "absolute",
            },
          }}
        >
          <Stack
            direction={"row"}
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <IconButton onClick={ev => handleGoBack(ev)} size="small">
              <ArrowBackIosNewOutlined />
            </IconButton>
            <IconButton
              onClick={(ev) => {
                ev.preventDefault();
                router.push("/", { scroll: false });
              }}
              size="small"
            >
              <HomeOutlined />
            </IconButton>
          </Stack>
        </Paper>
      </StickyBox>
    </React.Fragment>
  );
};

export default FeedAppBar;
