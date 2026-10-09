"use client";
import {
  Box,
  Container,
  IconButton,
  SwipeableDrawer,
  Stack,
  Typography,
  Checkbox,
  FormControl,
  TextField,
  InputAdornment,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import { Close, SearchOutlined } from "@mui/icons-material";
import React, { useState } from "react";
import { useCurrentLocation } from "@/hooks";

type Location = {
  id: string;
  country: string;
  city: string;
};

const locations: Location[] = [
  { id: "1", country: "Nigeria", city: "Makurdi" },
  { id: "2", country: "Nigeria", city: "Lagos" },
  { id: "3", country: "Nigeria", city: "Ibadan" },
  { id: "4", country: "Nigeria", city: "Port Harcourt" },
];

const PostLocationDrawer = ({
  isOpen,
  toggleDrawer,
  location,
  onCallback,
}: {
  isOpen?: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  location?: string;
  onCallback: (location?: string) => void;
}) => {
  const open = React.useMemo(() => isOpen, [isOpen]);

  const [state, setState] = useState<{
    searchedLocations: Location[];
    isSearching?: boolean;
    query: string;
    location?: string;
    locationId?: string;
  }>({
    searchedLocations: [],
    query: "",
  });

  

  const handleChange = (query: string) => {
    setState((prev) => ({ ...prev, query }));
    if (query.trim().length <= 2) {
      setState((prev) => ({ ...prev, query, searchedUsers: [] }));
      return;
    }
    // debounceSearch(query);
  };

  const handleSelected = (ev: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLDivElement, MouseEvent>,loc?: Location) => {
    onCallback(loc?.id === state.locationId  ? undefined: `${loc?.city}, ${loc?.country}`);
    setState((prev) => ({ ...prev, locationId: loc?.id === prev.locationId ? undefined : loc?.id }));
    // toggleDrawer(undefined, false);
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
        <Stack direction={"row"} sx={{ justifyContent: "flex-end", mx: 1 }}>
          <IconButton aria-label="Close" color="inherit" onClick={(ev) => toggleDrawer(ev, false)}>
            <Close />
          </IconButton>
        </Stack>
        <Container maxWidth="xl" sx={{ mt: 0, pb: 2 }}>
          <Box>
            <Typography
              sx={{ textAlign: "center", fontFamily: "PlayFair" }}
              variant="h6"
            >
              Choose Location?
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontFamily: "PlayFair" }}
              variant="body2"
            >
              Search location or pick current location
            </Typography>
          </Box>
          
          <Box>
            <FormControl fullWidth sx={{ borderRadius: 30 }}>
              <TextField
                placeholder="Search location..."
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
          {locations.length > 0 && (
            <List>
              {locations.map((loc) => (
                <ListItem
                  sx={{ px: 0 }}
                  dense
                  key={loc.id}
                  secondaryAction={
                    <Checkbox
                      edge="end"
                      onChange={ev => handleSelected(ev, loc)}
                      checked={state.locationId === loc.id}
                    />
                  }
                  disablePadding
                >
                  <ListItemButton
                    sx={{ px: 0 }}
                    onClick={(ev) => handleSelected(ev, loc )}
                  >
                    <ListItemText primary={loc.country} secondary={loc.city} />
                  </ListItemButton>
                  <Divider orientation="horizontal" variant="fullWidth" />
                </ListItem>
              ))}
            </List>
          )}
        </Container>
      </Box>
    </SwipeableDrawer>
  );
};

export default PostLocationDrawer;
