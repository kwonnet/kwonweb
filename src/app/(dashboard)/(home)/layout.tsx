import { StickySidebar, TopUserStories } from "@/components/common";
import { ConnectionServer } from "@/components/sections";
import { Box } from "@mui/material";
import React from "react";
import CreateTopSection from "./CreateTopSection";
import FeedTabNavigation from "./FeedTabNavigation";

const Layout = (props: any) => {
  return (
    <React.Fragment>
      <Box
        sx={{
          flexDirection: "row",
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
        }}
        className="page_wrapper"
      >
        {/* <Box sx={{ width: { lg: "65%", md: "65%", sm: "100%", xs: "100%" } }}> */}
        <Box className="page_content">
          <CreateTopSection />
          {/* <TopUserStories /> */}
          <FeedTabNavigation />
          {props.children}
        </Box>
        <StickySidebar ConnectionSection={<ConnectionServer />} />
      </Box>
    </React.Fragment>
  );
};

export default Layout;
