'use client'
import { ArrowBackIosNewOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";

const PageHeader = ({ title }: { title: string }) => {
  const router = useRouter();

  const handleClick = () => {
    router.back();
  };
  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ position: "relative" }}>
        <Box sx={{ position: "absolute" }}>
          <IconButton aria-label="Go back" color="inherit" onClick={() => handleClick()}>
            <ArrowBackIosNewOutlined />
          </IconButton>
        </Box>
      </Box>
      <Typography
        variant="h4"
        sx={{ pt: 0.7, fontFamily: "PlayFair", textAlign: "center" }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default PageHeader;
