import React from "react";
import TabNavigation from "./TabNavigation";
import { Box } from "@mui/material";

export default async function Layout(props: any) {
  return (
    <React.Fragment>
      <TabNavigation />
      <Box sx={{mt: 3, px: 1}}>
        {props.children}
      </Box>
      {/* <Box
        sx={{
          flexDirection: "row",
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <Box sx={{ width: { lg: "65%", md: "65%", sm: "100%", xs: "100%" } }}>
          <TabNavigation />
          <Box sx={{mt: 3, px: 1}}>
            {props.children}
          </Box>
        </Box>
        <StickySidebar pathname={"/connections"} />
      </Box> */}
    </React.Fragment>
  );
}
