import * as React from "react";
import Box from "@mui/material/Box";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import BuyCoinsContainer from "./BuyCoinsContainer";
import { CoinPackage, CryptoAddress } from "@/types";
import { Container, IconButton, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";
import StickyBox from "react-sticky-box";

export default function BuyCoinsDrawer({
  isOpen,
  toggleDrawer,
  data,
  currentTonRate,
  isPage,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  data: {
    packages: CoinPackage[];
    addresses: CryptoAddress[];
  };
  currentTonRate: number;
  isPage?: boolean;
}) {
  const open = React.useMemo(() => isOpen, [isOpen]);

  return (
    <div>
      <React.Fragment>
        <SwipeableDrawer
          anchor={"bottom"}
          open={open}
          onClose={(ev) => toggleDrawer(ev, false)}
          // onClick={(ev) => toggleDrawer(ev, false)}
          onOpen={(ev) => {}}
          sx={{
            zIndex: 999999999,
            height: "100vh",
            overflow: "hidden",
          }}
          slotProps={{
            paper: {
              sx: {
                top: { lg: "50%", md: "50%", sm: "30%", xs: "30%" },
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                zIndex: 999,
                overflow: "auto",
                width: { lg: 600, md: 600, sm: "100%", width: "100%" },
                maxWidth: "100%",
                margin: "0 auto",
              },
            },
          }}
        >
          <Box sx={{ width: "auto" }} role="presentation">
            <StickyBox style={{zIndex: 999}}>
              <Box sx={{ position: "relative" }}>
                {/* <Typography>Buy Coins</Typography> */}
                <Box sx={{ position: "absolute", right: 5 }}>
                  <IconButton aria-label="Close"
                    color="inherit"
                    onClick={(ev) => toggleDrawer(ev, false)}
                  >
                    <Close />
                  </IconButton>
                </Box>
              </Box>
            </StickyBox>
            <Container maxWidth="xl" sx={{ mt: 7, pb: 2 }}>
              <BuyCoinsContainer
                toggleDrawer={toggleDrawer}
                data={data}
                currentTonRate={currentTonRate}
                isPage={isPage}
              />
            </Container>
          </Box>
        </SwipeableDrawer>
      </React.Fragment>
    </div>
  );
}
