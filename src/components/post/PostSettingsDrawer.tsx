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
  Checkbox,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import React, { useState } from "react";
import { nanoid } from "nanoid";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import { PostScopeEnum } from "@/types/post";


type PostSettings = {
  id: string;
  title: string;
  name: PostScopeEnum;
  icon: React.JSX.Element;
};

const settingsData: PostSettings[] = [
  {
    id: nanoid(),
    title: "Anyone",
    name: PostScopeEnum.ANYONE,
    icon: <PublicOutlinedIcon />,
  },
  {
    id: nanoid(),
    title: "Verified accounts",
    name: PostScopeEnum.VERIFIED,
    icon: <VerifiedOutlinedIcon />,
  },
  {
    id: nanoid(),
    title: "Accounts you follow",
    name: PostScopeEnum.FOLLOWED,
    icon: <HowToRegOutlinedIcon />,
  },
  {
    id: nanoid(),
    title: "Mention & tag accounts",
    name: PostScopeEnum.MENTIONS,
    icon: <AlternateEmailOutlinedIcon />,
  },
];
const PostSettingsDrawer = ({
  isOpen,
  toggleDrawer,
  postScope,
  onPostSettingsCallback,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  postScope: PostScopeEnum;
  onPostSettingsCallback: (scope: PostScopeEnum) => void;
}) => {
  const open = React.useMemo(() => isOpen, [isOpen]);

  const [state, setState] = useState({ postScope });

  const handleSelected = (
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>,
    item: PostSettings
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    onPostSettingsCallback(item.name);
    setState((prev) => ({ ...prev, postScope: item.name }));
    toggleDrawer(ev, false);
  };

  return (
    <SwipeableDrawer
      sx={{
        zIndex: 9999999,
        height: "100vh",
        overflow: "hidden",
      }}
      anchor={"bottom"}
      open={open}
      onClose={(ev) => toggleDrawer(ev, false)}
      onOpen={(ev) => {}}
      slotProps={{
        paper: {
          sx: {
            top: {lg: "50%", md: "50%", sm: "30%", xs: "30%"},
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            zIndex: 999,
            overflow: "hidden",
            width: {lg: 600, md: 600, sm: "100%", width: "100%"},
            maxWidth: "100%",
            margin: "0 auto"
          },
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
          <Box>
            <Typography
              sx={{ textAlign: "center", fontFamily: "PlayFair" }}
              variant="h6"
            >
              Who can reply?
            </Typography>
            <Typography
              color="textDisabled"
              sx={{ fontFamily: "PlayFair" }}
              variant="body2"
            >
              Choose who can reply to this post. Acounts mentioned or tagged can
              always reply
            </Typography>
          </Box>
          <List sx={{ width: "100%"}}>
            {settingsData.map((item) => (
              <ListItem
                key={item.id}
                onClick={(ev) => handleSelected(ev, item)}
                disablePadding
                secondaryAction={
                  <IconButton
                    size="small"
                    edge="start"
                    aria-label={`${item.name}`}
                  >
                    {item.icon}
                  </IconButton>
                }
              >
                <ListItemButton>
                  <ListItemIcon>
                    <Checkbox
                      color="default"
                      edge="end"
                      onChange={(ev) => {}}
                      checked={item.name === state.postScope}
                      slotProps={{ input: { "aria-labelledby": item.id } }}
                    />
                  </ListItemIcon>
                  <ListItemText id={item.id} primary={item.title} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Container>
      </Box>
    </SwipeableDrawer>
  );
};

export default PostSettingsDrawer;
