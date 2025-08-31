import React from "react";
import SuggestedServer from "./SuggestedServer";
import PageClient from "./PageClient";
import NearYouServer from "./NearYouServer";
import MutualFollowsServer from "./MutualFollowsServer";
import InterestsServer from "./InterestsServer";
import PopularCreatorsServer from "./PopularCreatorsServer";

const page = async () => {
  return (
    <React.Fragment>
        <PageClient
          SuggestedServer={<SuggestedServer />}
          NearYouServer={<NearYouServer />}
          MutualFollowsServer={<MutualFollowsServer />}
          InterestsServer={<InterestsServer />}
          PopularCreatorsServer={<PopularCreatorsServer />}
        />
    </React.Fragment>
  );
};

export default page;
