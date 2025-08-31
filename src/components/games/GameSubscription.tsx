import React from "react";
import GameWallet from "./GameWallet";
import { Box } from "@mui/material";

const GameSubscription = ({
  currentUserId,
  catId,
  children
}: {
  currentUserId: string;
  catId: string;
  children?: React.ReactNode
}) => {
  const wallet = {
    credit: 200,
    bonus: 120,
    amount: 500,
  };

  

  return (
      <Box sx={{ p: 2, position: "relative" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            width: "100%",
            p: 1,
          }}
        >
          <GameWallet />
          {children}
          </Box>
      </Box>
      
  );
};

export default GameSubscription;
{/* <BuyCoinsDrawer 
        isOpen={state.isOpen} 
        toggleDrawer={toggleDrawer}
        data={data}
        currentTonRate={currentTonRate}
      /> */}