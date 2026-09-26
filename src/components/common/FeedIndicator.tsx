"use client";

import { Avatar, AvatarGroup, Box, Chip, Fade, Paper, Typography } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

type Props = {
  visible: boolean;
  count: number;
  onClick: () => void;
};

function ActivityBadge({ count = 3, text = "posted", avatars = [] }: { avatars: { id: string, src: string }[], text?: string, count?: number }) {
  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: '#1DA1F2',
        color: 'white',
        borderRadius: '50px',
        padding: '6px 14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.5,
        boxShadow: '0 4px 20px rgba(29, 161, 242, 0.4)',
      }}
    >
      <ArrowUpwardIcon sx={{ fontSize: 18 }} />
      <AvatarGroup max={4} spacing="small">
        {avatars.map((item, i) => (
          <Avatar key={item.id} src={item.src} sx={{ width: 28, height: 28, border: '2px solid white' }} />
        ))}
      </AvatarGroup>
      <Typography variant="body2" fontWeight="600">
        {text}
      </Typography>

    </Paper>
  );
}

export default function FeedIndicator({ visible, count, onClick }: Props) {
  return (
    <Fade in={visible}>
      <Box
      >
        <ActivityBadge avatars={[{ id: "1", src: "/story2.jpg" }, { id: "2", src: "/toncoin.png" }, { id: "3", src: "/post.jpg" }]}
          count={3}
          text="Posted"
        />
      </Box>
    </Fade>
  );
}
