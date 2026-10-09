"use client";
import {
  Box,
  Avatar,
  Container,
  FormControl,
  IconButton,
  TextField,
  Chip,
  Button,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  SwipeableDrawer,
  InputAdornment,
  Stack,
  CircularProgress,
  Divider,
} from "@mui/material";
import { ArrowBack, Close, Delete, SearchOutlined } from "@mui/icons-material";
import React, { useState, useEffect } from "react";
import { debounce } from "lodash";
import { searchUsers } from "@/lib/users";
import { useAuthSession } from "@/hooks";
import { TagUser } from "@/types/post";

const TagPeopleDrawer = ({
  isOpen,
  toggleDrawer,
  onUpdateTagUsers,
  tagUsers,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  onUpdateTagUsers: (user: TagUser[]) => void;
  tagUsers: TagUser[];
}) => {
  const open = React.useMemo(() => isOpen, [isOpen]);

  const { token } = useAuthSession();

  const [state, setState] = useState<{
    taggedUsers: TagUser[];
    searchedUsers: TagUser[];
    isSearching?: boolean;
    query: string;
  }>({ taggedUsers: tagUsers, searchedUsers: [], query: "" });

  const debounceSearch = React.useRef(
    debounce(async (query: string) => {
      try {
        setState((prev) => ({ ...prev, isSearching: true }));
        const users = await searchUsers({ query, page: 1, limit: 50 }, token);
        setState((prev) => ({ ...prev, searchedUsers: users }));
      } catch (error) {
        setState((prev) => ({ ...prev, searchedUsers: [] }));
      } finally {
        setState((prev) => ({ ...prev, isSearching: false }));
      }
    }, 500)
  ).current;

  const handleChange = (query: string) => {
    setState((prev) => ({ ...prev, query }));
    if (query.trim().length <= 2) {
      setState((prev) => ({ ...prev, query, searchedUsers: [] }));
      return;
    }
    debounceSearch(query);
  };

  const handleSelect = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
    _user: TagUser
  ) => {
    ev.preventDefault();
    setState((prev) => ({
      ...prev,
      taggedUsers: [
        ...prev.taggedUsers.filter((item) => item.id !== _user.id),
        _user,
      ],
      query: "",
      searchedUsers: [],
    }));
  };

  const handleDelete = (id: string) => {
    setState((prev) => ({
      ...prev,
      taggedUsers: prev.taggedUsers.filter((item) => item.id !== id),
    }));
  };

  const handleTagUsers = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.preventDefault();
    onUpdateTagUsers(state.taggedUsers);
    toggleDrawer(ev, false);
  };

  const handleCloseDrawer = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    setState((prev) => ({ ...prev, taggedUsers: tagUsers }));
    toggleDrawer(ev, false);
  };

  useEffect(() => {
    return () => {
      debounceSearch.cancel();
    };
  }, [debounceSearch]);

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
      slotProps={{
        paper: {
          sx: {
            top: { lg: "50%", md: "50%", sm: "30%", xs: "30%" },
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            zIndex: 999,
            overflow: "hidden",
            width: { lg: 600, md: 600, sm: "100%", width: "100%" },
            maxWidth: "100%",
            margin: "0 auto",
          },
        },
      }}
    >
      <Box sx={{ width: "auto" }} role="presentation">
        <Stack
          direction={"row"}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            mx: 1,
            my: 1,
          }}
        >
          <IconButton aria-label="Close" color="inherit" onClick={(ev) => toggleDrawer(ev, false)}>
            <Close />
          </IconButton>
          <Typography>Tag People</Typography>
          <Button
            size="small"
            color="primary"
            variant="contained"
            sx={{ borderRadius: 30 }}
            onClick={(ev) => handleTagUsers(ev)}
          >
            Done
          </Button>
        </Stack>
        <Container maxWidth="xl" sx={{ mt: 0, pb: 2 }}>
          <Box>
            <FormControl fullWidth sx={{ borderRadius: 30 }}>
              <TextField
                placeholder="Search people..."
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        {state.isSearching ? (
                          <CircularProgress color="warning" size={20} />
                        ) : (
                          <SearchOutlined />
                        )}
                      </InputAdornment>
                    ),
                  },
                }}
                value={state.query}
                onChange={(ev) => handleChange(ev.target.value)}
              />
            </FormControl>
          </Box>
          {state.searchedUsers.length > 0 ? (
            <List>
              {state.searchedUsers.map((user) => (
                <ListItem sx={{ px: 0 }} dense key={user.id}>
                  <ListItemButton
                    sx={{ px: 0 }}
                    onClick={(ev) => handleSelect(ev, user)}
                  >
                    <ListItemIcon>
                      <Avatar alt={user.name} src={user.avatar} />
                    </ListItemIcon>
                    <ListItemText
                      primary={user.name}
                      secondary={`@${user.username}`}
                    />
                  </ListItemButton>
                  <Divider orientation="horizontal" variant="fullWidth" />
                </ListItem>
              ))}
            </List>
          ) : (
            state.taggedUsers.map((user) => (
              <Chip
                sx={{ mx: 1, my: 0.5 }}
                key={user.id}
                label={user.name}
                deleteIcon={<Delete />}
                onDelete={() => handleDelete(user.id)}
                avatar={<Avatar src={user.avatar} />}
              />
            ))
          )}
        </Container>
      </Box>
    </SwipeableDrawer>
  );
};

export default TagPeopleDrawer;
