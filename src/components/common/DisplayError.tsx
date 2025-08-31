import { Box, CardMedia, Typography } from "@mui/material";
import React from "react";

const DisplayError = ({
  status,
  message,
}: {
  status: number;
  message?: string;
}) => {
  const isError404 = status === 404;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        overflow: "hidden",
        width: "100%",
        flexDirection: "column"
      }}
    >
      <CardMedia
        component={"img"}
        image={"/no-data.svg"}
        sx={{ height: 300, width: 300 }}
      />
      <Typography>{!isError404 ? message : null} </Typography>
    </Box>
  );
};

export default DisplayError;
