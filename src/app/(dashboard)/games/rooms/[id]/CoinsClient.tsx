'use client'
import { BuyCoinsDrawer } from "@/components/store";
import { CoinPackage, CryptoAddress } from "@/types";
import { Box, Button } from "@mui/material";
import React, { useState } from "react";

const CoinsClient = ({
  data,
  currentTonRate,
  isPage = true
}: {
  data: {
    packages: CoinPackage[];
    addresses: CryptoAddress[];
  };
  currentTonRate: number;
  isPage?: boolean
}) => {
  const [state, setState] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  const toggleDrawer = (
    event:
      | React.KeyboardEvent
      | React.MouseEvent
      | React.SyntheticEvent<{}, Event>,
    open: boolean
  ) => {
    if (
      event &&
      event.type === "keydown" &&
      ((event as React.KeyboardEvent).key === "Tab" ||
        (event as React.KeyboardEvent).key === "Shift")
    ) {
      return;
    }
    setState((prev) => ({ ...prev, isOpen: open }));
  };

  return (
    <Box>
      <Box sx={{
        my: 2
      }}>
        <Button
          variant="outlined"
          sx={[
            (theme) => ({
              width: "100%",
              border: `2px solid theme.vars.palette.shades[500]`,
              // background: "linear-gradient(135deg, #FE6B8B 30%, #FF8E53 90%)",
              color: theme.vars.palette.shades[500],
              borderRadius: "50px",
              fontWeight: "bold",
              padding: "10px 20px",
              fontSize: "16px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
              transition:
                "transform 2s ease, box-shadow 1s ease, background 1s ease, border-color 1.2s ease",
              "&:hover": {
                background: theme.vars.palette.gradient.E900,
                transition:
                  "transform 2s ease, box-shadow 1s ease, background 1s ease, border-color 1.2s ease",
                border: `2px solid ${theme.vars.palette.shades[500]}`, // Outline on hover
                color: "#fff",
                transform: "scale(1.05)",
                boxShadow: "0px 8px 12px rgba(0, 0, 0, 0.3)",
              },
              "&:active": {
                transform: "scale(1.02)",
              },
              ...theme.applyStyles("dark", {
                color: theme.vars.palette.gradient.contrastText,
              }),
            }),
          ]}
          onClick={(ev) => toggleDrawer(ev, true)}
        >
          Buy Coins Now
        </Button>
      </Box>
      <BuyCoinsDrawer 
        isOpen={state.isOpen} 
        toggleDrawer={toggleDrawer}
        data={data}
        currentTonRate={currentTonRate}
        isPage={isPage}
      />
    </Box>
  );
};

export default CoinsClient;
