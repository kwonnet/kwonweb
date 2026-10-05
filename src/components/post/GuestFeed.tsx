"use client";
import { useMemo } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import FeedCardItem from "./FeedCardItem";
import { publicPreviewCard, type PublicPostPreview } from "@/utils/public-feed";
import { requestGuestLogin } from "@/utils/guest-auth-trigger";

const loginForQuote = async () => { requestGuestLogin(); };

export default function GuestFeed({ posts, unavailable = false, searchResults = false }: { posts: PublicPostPreview[]; unavailable?: boolean; searchResults?: boolean }) {
  const cards = useMemo(() => posts.map(publicPreviewCard), [posts]);
  if (!cards.length) return <Paper sx={{ p: 4, textAlign: "center" }}>
    <Typography variant="h6">{unavailable ? "The feed is temporarily unavailable" : "Welcome to Kwonnet"}</Typography>
    <Typography color="text.secondary" sx={{ my: 2 }}>{unavailable ? "Please try again shortly, or log in to continue." : "Join the community and start a conversation."}</Typography>
    <Button href="/?auth=signin" variant="contained">Log in</Button>
  </Paper>;
  return <Box aria-label="Public newsfeed" sx={{ mt: 1 }}>
    {cards.map(post => <FeedCardItem key={post.id} post={post}
      handleReaction={requestGuestLogin} handleRepost={requestGuestLogin} handleShare={requestGuestLogin}
      handleBookmark={requestGuestLogin} onQuoteClick={loginForQuote} onFollowUserCallback={requestGuestLogin} />)}
    {!searchResults && <Box sx={{ py: 3, textAlign: "center" }}><Button onClick={requestGuestLogin} variant="outlined">Log in to see more</Button></Box>}
  </Box>;
}
