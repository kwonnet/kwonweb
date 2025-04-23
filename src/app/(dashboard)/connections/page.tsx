import { Box } from "@mui/material";
import React from "react";
import SuggestedServer from "./SuggestedServer";
import StickySidebar from "../StickySidebar";
import PageClient from "./PageClient";
import NearYouServer from "./NearYouServer";
import MutualFollowsServer from "./MutualFollowsServer";
import InterestsServer from "./InterestsServer";
import PopularCreatorsServer from "./PopularCreatorsServer";

const page = async () => {
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
        <Box sx={{ width: { lg: "65%", md: "65%", sm: "100%", xs: "100%" } }}>
          <Box>
            <PageClient
              SuggestedServer={<SuggestedServer />}
              NearYouServer={<NearYouServer />}
              MutualFollowsServer={<MutualFollowsServer />}
              InterestsServer={<InterestsServer />}
              PopularCreatorsServer={<PopularCreatorsServer />}
            />
          </Box>
        </Box>
        <StickySidebar pathname={"/connections"} />
      </Box>
    </React.Fragment>
  );
};

export default page;
