"use client";
import React from "react";
import {
  Box,
  Paper,
} from "@mui/material";

const PaperLayout = (props: { children: any, boxHeight?: string}) => {
  return (
    <Box sx={{mb: 1}}>
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          borderRadius: 3,
          boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.1)",
          height: props.boxHeight,
        }}
      >
        {props.children}
      </Paper>
    </Box>
  );
};

export default PaperLayout;





// "use client";
// import React from "react";
// import {
//   Box,
//   Paper,
// } from "@mui/material";

// const PaperLayout = (props: {}) => {
//   // !isSmallScreen ? `calc(100vh - 145px)` : `calc(100vh - 220px)`
//   return (
//     <Box sx={{mb: 1}}>
//       <Paper
//         elevation={3}
//         sx={{
//           width: "100%",
//           borderRadius: 3,
//           boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.1)",
//           // height: "calc(100vh - 186px)",
//           // overflowY: "auto"
//         }}
//       >
//         {props.children}
//       </Paper>
//     </Box>
//   );
// };

// export default PaperLayout;
