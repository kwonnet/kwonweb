import {pageMetadata} from '@/lib/seo';
import { Typography } from "@mui/material";
import React from "react";

const page = () => {
  return (
    <React.Fragment>
      <Typography sx={{ fontFamily: "cursive" }} variant="h3">
        Try Swem - Smarter. Closer. Yours.
      </Typography>
      <Typography variant="h6">
        Say hello to Swem — your smart friend on Torazon.
      </Typography>
      <Typography variant="body2">
        Swem learns what you love, curates content just for you, and helps you
        explore more of what matters. Whether you're discovering trends, people,
        or new ideas, Swem is always by your side.
      </Typography>
    </React.Fragment>
  );
};

export default page;

export const metadata = pageMetadata('Swem', 'Swem on Kwonnet. Connect with your community and manage your experience.', '/swem', false);
