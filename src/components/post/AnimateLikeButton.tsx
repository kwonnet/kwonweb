"use client";
import { Box, IconButton } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";

const emojis = [
  "✨",
  "💥",
  "✨",
  "💥",
  "✨",
  "🔥",
  "✨",
  "✨",
  "✨",
  "💥",
  "🔥",
  "✨",
  "🎉",
  "💥",
  "✨",
];
const RADIUS = 60;

const AnimateLikeButton = ({
  handleReaction,
  liked,
}: {
  handleReaction: (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  liked?: boolean;
}) => {
  const [state, setState] = useState<{
    bursts: any[];
  }>({
    bursts: [],
  });
  const handleLike = (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    handleReaction(ev);
    // Create multiple random emojis with random positions
    const newBurst = Array.from({ length: 20 }, (_, i) => {
      const angle = ((2 * Math.PI) / 20) * i;
      const x = Math.cos(angle) * RADIUS;
      const y = Math.sin(angle) * RADIUS;

      return {
        id: Date.now() + i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x,
        y,
        rotate: Math.random() * 360,
      };
    });

    setState((prev) => ({
      ...prev,
      bursts: [...prev.bursts, ...newBurst],
    }));

    // Remove burst emojis after animation
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        bursts: prev?.bursts.slice(newBurst.length),
      }));
    }, 1000);
  };
  return (
    <Box position="relative" display="inline-block">
      <Box display="flex" alignItems="center" gap={1}>
        <IconButton
          onClick={(ev) => handleLike(ev)}
          component={motion.button}
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1 }}
        >
          {!liked ? (
            <FavoriteBorderOutlinedIcon
              sx={{
                height: 16,
                width: 16,
                color: (theme) => theme.vars.palette.text.disabled,
                transition: "color 0.3s ease",
              }}
            />
          ) : (
            <FavoriteOutlinedIcon
              sx={{
                height: 16,
                width: 16,
                color: (theme) => theme.vars.palette.error.main,
                transition: "color 0.3s ease",
              }}
            />
          )}
        </IconButton>
      </Box>
      <AnimatePresence>
        {state.bursts.map((burst) => (
          <motion.div
            key={burst.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: burst.x,
              y: burst.y,
              scale: 1.5,
              rotate: burst.rotate,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: "40%",
              top: "30%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              fontSize: 10,
            }}
          >
            {burst.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
};

export default AnimateLikeButton;
