"use client";
import {
  CryptoAddress,
  SubscriptionPlan,
} from "@/types";
import {
  Box,
} from "@mui/material";
import React from "react";
import ResponsiveCarousel from "@/components/common/ResponsiveCarousel";
import DisplayPlanItem from "./DisplayPlanItem";


const DisplayCarouselItems = ({plans, tonRate, cryptoAddreses}:{ plans: SubscriptionPlan[]; tonRate: number; cryptoAddreses: CryptoAddress[]}) => {
    return (
      <Box>
        <ResponsiveCarousel desktopItems={3} tabletItems={3} arrows={false}>
          {plans.map((item) => (
            <DisplayPlanItem
              key={item.id}
              plan={item}
              tonRate={tonRate}
              cryptoAddreses={cryptoAddreses}
            />
          ))}
        </ResponsiveCarousel>
      </Box>
    );
  };

  export default DisplayCarouselItems
  