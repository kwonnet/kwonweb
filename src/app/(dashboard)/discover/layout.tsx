import React from "react";
import TabNavigation from "./TabNavigation";
import { Box } from "@mui/material";
import { ConnectionServer } from "@/components/sections";
import { StickySidebar } from "@/components/common";

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
        <Box className="page_content">
          <TabNavigation />
          {props.children}
        </Box>
        <StickySidebar ConnectionSection={<ConnectionServer />} />
      </Box>
    </React.Fragment>
  );
};

export default Layout;
