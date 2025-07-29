import * as React from "react";
import Box from "@mui/material/Box";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import BuyCoinsContainer from "./BuyCoinsContainer";
import { CoinPackage, CryptoAddress } from "@/types";
import { Container, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";

export default function BuyCoinsDrawer({

  isOpen,
  toggleDrawer,
  data,
  currentTonRate,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  data: {
    packages: CoinPackage[];
    addresses: CryptoAddress[];
  };
  currentTonRate: number;
}) {

    const open = React.useMemo(() => isOpen, [isOpen] )

  return (
    <div>
      <React.Fragment>
        <SwipeableDrawer
          anchor={"bottom"}
          open={open}
          onClose={(ev) => toggleDrawer(ev, false)}
          // onClick={(ev) => toggleDrawer(ev, false)}
          onOpen={(ev) => {}}
          PaperProps={{sx: { 
            top: "50px", 
            borderTopLeftRadius: "8px", 
            borderTopRightRadius: "8px"
          } }}
        >
          <Box sx={{ width: "auto",}} role="presentation">
            <Box sx={{ position: "relative" }}>
              <Box sx={{ position: "absolute", right: 5 }}>
                <IconButton color="inherit" onClick={(ev) => toggleDrawer(ev, false)}>
                  <Close />
                </IconButton>
              </Box>
            </Box>
            <Container maxWidth="xl" sx={{mt: 7, pb: 2}}>
            <BuyCoinsContainer toggleDrawer={toggleDrawer} data={data} currentTonRate={currentTonRate} />
            </Container>
          </Box>
        </SwipeableDrawer>
      </React.Fragment>
    </div>
  );
}
