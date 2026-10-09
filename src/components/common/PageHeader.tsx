"use client";
import { ArrowBackIosNewOutlined, Wallet } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import StickyBox from "react-sticky-box";

const PageHeader = ({
  title,
  RightIcon,
}: {
  title: React.ReactNode;
  RightIcon?: React.ReactNode;
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.back();
  };

  const isRightIcon = !!RightIcon;

  return (
    <StickyBox style={{zIndex: 999}}>
      <Box >
        <Stack
          direction="row"
          sx={[
            (theme) => ({
              justifyContent: isRightIcon ? "space-between" : "inherit",
              bgcolor: theme.vars.palette.AppBar.defaultBg,
              ...theme.applyStyles("dark", {
                bgcolor: theme.vars.palette.AppBar.darkBg,
              }),
              py: 1
            }),
          ]}
        >
          <Box sx={{ position: "relative" }}>
            <IconButton aria-label="Go back" color="inherit" onClick={() => handleClick()}>
              <ArrowBackIosNewOutlined />
            </IconButton>
          </Box>
          <Box
            sx={{
              fontFamily: "PlayFair",
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            {typeof title === "string" ? (
              <Typography
                variant="h4"
                sx={
                  {
                    // fontFamily: "PlayFair",
                    // textAlign: "center",
                    // alignSelf: "center",
                    // flexGrow: 1,
                  }
                }
              >
                {title}
              </Typography>
            ) : (
              title
            )}
          </Box>

          {RightIcon}
        </Stack>
      </Box>
    </StickyBox>
  );
};

export default PageHeader;
