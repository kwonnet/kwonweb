"use client";
import { Box } from "@mui/material";
import type { ReactNode } from "react";

export default function FlipCard({ isFlipped, children }: { isFlipped: boolean; children: [ReactNode, ReactNode] }) {
  return <Box sx={{ perspective: "1000px" }}>
    <Box sx={{ display: "grid", transformStyle: "preserve-3d", transform: isFlipped ? "rotateX(180deg)" : "rotateX(0)", transition: "transform 600ms", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>
      <Box aria-hidden={isFlipped} inert={isFlipped} sx={{ gridArea: "1 / 1", backfaceVisibility: "hidden", pointerEvents: isFlipped ? "none" : "auto" }}>{children[0]}</Box>
      <Box aria-hidden={!isFlipped} inert={!isFlipped} sx={{ gridArea: "1 / 1", backfaceVisibility: "hidden", transform: "rotateX(180deg)", pointerEvents: isFlipped ? "auto" : "none" }}>{children[1]}</Box>
    </Box>
  </Box>;
}
