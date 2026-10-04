import StickySidebar from "@/components/common/StickySidebar";
import SidebarTrendServer from "@/components/common/SidebarTrendServer";
import ConnectionServer from "@/components/sections/ConnectionServer";
import { Box } from "@mui/material";
import React from "react";


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
          {props.children}
        </Box>
        <StickySidebar TrendingSection={<SidebarTrendServer />} ConnectionSection={<ConnectionServer />} />
      </Box>
    </React.Fragment>
  );
};

export default Layout;
