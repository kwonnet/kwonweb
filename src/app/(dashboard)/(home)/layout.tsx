import StickySidebar from "@/components/common/StickySidebar";
import SidebarTrendServer from "@/components/common/SidebarTrendServer";
import ConnectionServer from "@/components/sections/ConnectionServer";
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
          gap: { xs: 0, md: 2 },
          width: "100%",
          minWidth: 0,
        }}
        className="page_wrapper"
      >
        {/* <Box sx={{ width: { lg: "65%", md: "65%", sm: "100%", xs: "100%" } }}> */}
        <Box className="page_content" sx={{ minWidth: 0 }}>
          {/* <TopUserStories /> */}
          <FeedTabNavigation />
          <CreateTopSection />
          {props.children}
        </Box>
        <StickySidebar TrendingSection={<React.Suspense fallback={null}><SidebarTrendServer /></React.Suspense>} ConnectionSection={<React.Suspense fallback={null}><ConnectionServer /></React.Suspense>} />
      </Box>
    </React.Fragment>
  );
};

export default Layout;
