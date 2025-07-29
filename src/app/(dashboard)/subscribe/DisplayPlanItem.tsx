"use client";
import {
  CryptoAddress,
  SubscriptionPlan,
} from "@/types";
import {
  Box,
  Button,
  List,
  Paper,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import CheckIcon from "@mui/icons-material/Check";
import SubscribeDrawer from "./SubscribeDrawer";
import { useAuthSession } from "@/hooks";
import { formatNumberWithCommas } from "@/utils";

const DisplayPlanItem = ({
    plan,
    tonRate,
    cryptoAddreses,
  }: {
    plan: SubscriptionPlan;
    tonRate: number;
    cryptoAddreses: CryptoAddress[];
  }) => {
    const [state, setState] = useState<{ isOpen: boolean }>({ isOpen: false });
  
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

    const { user } = useAuthSession()
    const isUSD = user?.country?.iso3 !== "NGA";
    const itemCurrency = isUSD ? "$" : "₦"
    const itemPrice = !isUSD ? plan.ngnPrice : plan.price;
  
    return (
      <React.Fragment>
        <Box sx={{ mb: 2, px: 1 }}>
          <Paper
            key={plan.id}
            sx={{
              minheight: "400px",
              width: "100%",
              boxShadow: 5,
              borderRadius: 3,
              mb: 1,
              p: 2,
            }}
          >
            <Typography
              variant="h3"
              sx={{ textAlign: "center", fontFamily: "PlayFair" }}
            >
              {plan.name}
            </Typography>
            {plan.features.map((feature) => (
              <Box key={feature.id}>
                <Typography
                  variant="h5"
                  sx={{
                    textAlign: "center",
                    fontStyle: "italic",
                    fontFamily: "PlayFair",
                  }}
                >
                  {feature.name}
                </Typography>
                <List>
                {feature.items.map((item) => (
                  <ListItem
                    key={item.id}
                    disableGutters
                    secondaryAction={
                      !item.label.trim() ? (
                        <CheckIcon color="success" />
                      ) : (
                        item.label
                      )
                    }
                  >
                    <ListItemText primary={item.title} />
                  </ListItem>
                ))}
                </List>
              </Box>
            ))}
          </Paper>
          <Box sx={{ position: "relative", bottom: 0 }}>
            <Button
              onClick={(ev) => toggleDrawer(ev, true)}
              variant="contained"
              color="info"
              sx={{ width: "100%", mt: 1, borderRadius: 30, textAlign: "center" }}
            >
              Starting {itemCurrency}{formatNumberWithCommas(itemPrice)}
            </Button>
          </Box>
        </Box>
        <SubscribeDrawer
          isOpen={state.isOpen}
          toggleDrawer={toggleDrawer}
          plan={plan}
          tonRate={tonRate}
          cryptoAddreses={cryptoAddreses}
        />
      </React.Fragment>
    );
  };

  export default DisplayPlanItem