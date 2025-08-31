"use client";
import {
  Box,
  Container,
  IconButton,
  SwipeableDrawer,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Divider,
} from "@mui/material";
import { ArrowBack, Check, Close } from "@mui/icons-material";
import React, { useState } from "react";
import QuickreplyOutlinedIcon from "@mui/icons-material/QuickreplyOutlined";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import TextsmsOutlinedIcon from '@mui/icons-material/TextsmsOutlined';

const FeedQuoteActionDrawer = ({
  isOpen,
  toggleDrawer,
  onRepost,
  onQuote,
  postId,
  hasReposted
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  onRepost: (id: string) => void;
  onQuote: (id: string) => void;
  postId: string;
  hasReposted: boolean;
}) => {
  const open = React.useMemo(() => isOpen, [isOpen]);

  const [state, setState] = useState({ isCopied: false });

  const handleRepost = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    toggleDrawer(ev, false);
    onRepost(postId);
  };

  const handleQuote = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    ev.preventDefault();
    ev.stopPropagation();
    toggleDrawer(ev, false);
    onQuote(postId);
  };

  return (
    <SwipeableDrawer
      sx={{
        zIndex: 999999999,
        height: "100vh",
        overflow: "hidden",
      }}
      anchor={"bottom"}
      open={open}
      onClose={(ev) => toggleDrawer(ev, false)}
      onOpen={(ev) => {}}
      PaperProps={{
        sx: {
          top: "70%",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
          zIndex: 999,
          overflow: "hidden"
        },
      }}
    >
      <Box sx={{ width: "auto" }} role="presentation">
        <Stack direction={"row"} sx={{ justifyContent: "flex-end", mx: 1 }}>
          <IconButton color="inherit" onClick={(ev) => toggleDrawer(ev, false)}>
            <Close />
          </IconButton>
        </Stack>
        <Container maxWidth="xl" sx={{ mt: 0, pb: 2 }}>
          <List
            sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
          >
            <ListItem>
            <ListItemButton onClick={ev => handleRepost(ev)}>
            <ListItemText primary={hasReposted ? `Undo Repost` : `Repost`} />
              <ListItemIcon>
                <RepeatOutlinedIcon
                  sx={{
                    height: 16,
                    width: 16,
                    transform: "rotate(90deg)",
                    color: (theme) => hasReposted ? theme.vars.palette.success.light : theme.vars.palette.text.disabled,
                  }}
                />
              </ListItemIcon>
            </ListItemButton>
            </ListItem>
            <Divider />
            <ListItem>
            <ListItemButton onClick={ev => handleQuote(ev)} >
              <ListItemText primary={`Quote`} />
              <ListItemIcon>
                <TextsmsOutlinedIcon
                  sx={{
                    height: 16,
                    width: 16,
                    color: (theme) => theme.palette.text.disabled,
                  }}
                />
              </ListItemIcon>
            </ListItemButton>
            </ListItem>
          </List>
        </Container>
      </Box>
    </SwipeableDrawer>
  );
};

export default FeedQuoteActionDrawer;
