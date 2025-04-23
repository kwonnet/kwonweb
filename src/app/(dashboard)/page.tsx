import React from "react";
import { Box } from "@mui/material";
import PageContent from "./PageContent";
import StickySidebar from "./StickySidebar";
import FeedServer from "./FeedServer";
import { ConnectionServer } from "@/components/sections";

export default function Home() {
  return (
    <React.Fragment>
      <Box
        sx={{
          flexDirection: "row",
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <Box sx={{ width: { lg: "65%", md: "65%", sm: "100%", xs: "100%"} }}>
          <PageContent FeedServer={<FeedServer />} />
        </Box>
        <StickySidebar ConnectionSection={<ConnectionServer />} />
      </Box>
    </React.Fragment>
  );
}
