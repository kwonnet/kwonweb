"use client";
import { ArrowBackIosNewOutlined, Wallet } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const PageHeader = ({
  title,
  RightIcon,
}: {
  title: string;
  RightIcon?: React.ReactNode;
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.back();
  };

  const isRightIcon = !!RightIcon;

  return (
    <Box sx={{ py: 1 }}>
      <Stack
        direction="row"
        sx={{ justifyContent: isRightIcon ? "space-between" : "inherit" }}
      >
        <Box sx={{ position: "relative" }}>
          <IconButton color="inherit" onClick={() => handleClick()}>
            <ArrowBackIosNewOutlined />
          </IconButton>
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontFamily: "PlayFair",
            textAlign: "center",
            alignSelf: "center",
            flexGrow: 1,
          }}
        >
          {title}
        </Typography>
        {RightIcon}
      </Stack>
    </Box>
  );
};

export default PageHeader;
