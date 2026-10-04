"use client";
import {
  Box,
} from "@mui/material";
import React from "react";
import ResponsiveCarousel from "@/components/common/ResponsiveCarousel";
import { FollowAction, UserConnection } from "@/types/user";
import ConnectionCard from "./ConnectionCard";


const DisplayCarousel = ({items, onFollowUser}:{ items: UserConnection[];onFollowUser: (connUser: UserConnection, action: FollowAction) => void}) => {
  if(items.length === 0) return null
    return (
      <Box className="conn-carousel">
        <ResponsiveCarousel desktopItems={4} tabletItems={3} hideMobileArrows>
          {items.map((item) => (
            <ConnectionCard 
              key={item.id} 
              item={item} 
              onFollowUser= {onFollowUser}
              />
          ))}
        </ResponsiveCarousel>
      </Box>
    );
  };

  export default DisplayCarousel
  