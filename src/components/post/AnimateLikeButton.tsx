"use client";
import { IconButton } from "@mui/material";
import { memo } from "react";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";

const AnimateLikeButton = ({ handleReaction, liked = false }: {
  handleReaction: (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  liked?: boolean;
}) => (
  <IconButton
    aria-label={liked ? "Unlike post" : "Like post"}
    aria-pressed={liked}
    onClick={handleReaction}
    sx={{ color: liked ? 'error.main' : 'text.secondary', '&:active': { transform: 'scale(0.92)' } }}
  >
    {liked ? <FavoriteOutlinedIcon sx={{ height: 16, width: 16 }} /> : <FavoriteBorderOutlinedIcon sx={{ height: 16, width: 16 }} />}
  </IconButton>
);
export default memo(AnimateLikeButton);
