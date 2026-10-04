"use client";
import { Avatar, Box, Button, Paper, Stack, Typography } from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import RepeatIcon from "@mui/icons-material/Repeat";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import PostText from "./PostText";

export type PublicPostPreview = {
  id: string; content: string | null; createdAt: string; userId: string;
  author: { name: string; username: string; avatar: string | null };
  totalLikes: string; totalReplies: string; totalReposts: string;
  media: { id: string; fileId: string; url: string; thumbnailUrl: string | null; fileType: string; altText: string | null }[];
};

/** Real public posts without personalized hooks, authenticated analytics, or an editor. */
export default function GuestFeed({ posts, unavailable = false }: { posts: PublicPostPreview[]; unavailable?: boolean }) {
  if (!posts.length) return <Paper sx={{ p: 4, textAlign: "center" }}>
    <Typography variant="h6">{unavailable ? "The feed is temporarily unavailable" : "Welcome to Kwonnet"}</Typography>
    <Typography color="text.secondary" sx={{ my: 2 }}>{unavailable ? "Please try again shortly, or log in to continue." : "Join the community and start a conversation."}</Typography>
    <Button href="/?auth=signup" variant="contained">Join Kwonnet</Button>
  </Paper>;
  return <Box aria-label="Public newsfeed">
    {posts.map(post => <Paper component="article" key={post.id} sx={{ mb: 1.5, overflow: "hidden", borderRadius: 1 }}>
      <Stack direction="row" spacing={1.5} sx={{ p: 2, alignItems: "center" }}>
        <Avatar src={post.author.avatar ?? undefined} alt={post.author.name}>{post.author.name[0]}</Avatar>
        <Box sx={{ minWidth: 0 }}><Typography sx={{ fontWeight: 700 }}>{post.author.name}</Typography>
          <Typography variant="body2" color="text.secondary">@{post.author.username}</Typography></Box>
      </Stack>
      <PostText content={post.content ?? ""} />
      <Box sx={{ display: "grid", gridTemplateColumns: post.media.length > 1 ? "1fr 1fr" : "1fr", gap: 0.5 }}>
        {post.media.map(media => <Box key={media.id} sx={{ position: "relative", minWidth: 0, bgcolor: "#111" }}>
          {/* A poster is enough during the brief preview; clicking play opens authentication. */}
          <Box component="img" src={media.fileType.startsWith("video") ? media.thumbnailUrl || undefined : media.url}
            alt={media.altText || (media.fileType.startsWith("video") ? "Video preview" : "Post image")} loading="lazy" decoding="async"
            sx={{ width: "100%", maxHeight: 480, aspectRatio: "16/9", objectFit: "contain", display: "block" }} />
          {media.fileType.startsWith("video") && <Button aria-label="Log in to play video" href="/?auth=signin" data-auth-mode="signin"
            sx={{ position: "absolute", inset: 0, color: "white" }}><PlayCircleOutlineIcon sx={{ fontSize: 56 }} /></Button>}
        </Box>)}
      </Box>
      <Stack direction="row" sx={{ p: 1, justifyContent: "space-around" }}>
        <Button aria-label={`${post.totalReplies} replies. Join to reply.`} startIcon={<ChatBubbleOutlineIcon />} href="/?auth=signup">{post.totalReplies}</Button>
        <Button aria-label={`${post.totalReposts} reposts. Join to repost.`} startIcon={<RepeatIcon />} href="/?auth=signup">{post.totalReposts}</Button>
        <Button aria-label={`${post.totalLikes} likes. Join to like.`} startIcon={<FavoriteBorderIcon />} href="/?auth=signup">{post.totalLikes}</Button>
      </Stack>
    </Paper>)}
  </Box>;
}
