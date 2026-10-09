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
  Button,
} from "@mui/material";
import {
  ArrowBackOutlined,
  Close,
  FlagOutlined,
  Web,
} from "@mui/icons-material";
import React, { useState } from "react";
import { nanoid } from "nanoid";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import { PostScopeEnum, PostScopeSetting } from "@/types/post";
import { getContinentsAndCountries } from "@/lib/locations";
import useSWR from "swr";
import { useAuthSession, useContinentsCountries } from "@/hooks";
import { useNotifications } from "@/providers/NotificationsProvider";
import { Continent, Country } from "@/types";
import DisplayCountries from "./DisplayCountries";
import DisplaySkeleton from "./DisplaySkeleton";
import DisplayContinents from "./DisplayContinents";

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
  {
    id: nanoid(),
    title: "Country",
    name: PostScopeEnum.COUNTRY,
    icon: <FlagOutlined />,
  },
  {
    id: nanoid(),
    title: "Continent",
    name: PostScopeEnum.CONTINENT,
    icon: <Web />,
  },
];

const PostSettingsDrawer = ({
  isOpen,
  toggleDrawer,
  settings,
  onPostSettingsCallback,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  settings: PostScopeSetting;
  onPostSettingsCallback: (arags: PostScopeSetting) => void;
}) => {
  const open = React.useMemo(() => isOpen, [isOpen]);

  const [state, setState] = useState<{
    scope: PostScopeEnum;
    countries: string[];
    continents: string[];
    showSelection?: boolean;
  }>({ ...settings });

  const { token } = useAuthSession();

  const notif = useNotifications();

  const { countries, continents} = useContinentsCountries()
  // const { data, isLoading } = useSWR(`/continents`, () =>
  //   getContinentsAndCountries(token)
  // );

  // const countries: Country[] =
  //   !data && isLoading
  //     ? []
  //     : (data
  //         ?.map((item) => item.countries)
  //         .flatMap((item) => item)
  //         ?.sort((a, b) => a.name.localeCompare(b.name)) ?? []);

  // const continents: Continent[] =
  //   !data && isLoading
  //     ? []
  //     : (data?.sort((a, b) => a.name.localeCompare(b.name)) ?? []);

  const handleSelected = (
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>,
    item: PostSettings
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    setState((prev) => {
      let currState = prev;
      if (item.name === PostScopeEnum.COUNTRY) {
        currState = {
          ...prev,
          showSelection: true,
          scope: item.name,
          continents: [],
        };
      } else if (item.name === PostScopeEnum.CONTINENT) {
        currState = {
          ...prev,
          showSelection: true,
          scope: item.name,
          countries: [],
        };
      } else {
        currState = {
          ...prev,
          showSelection: false,
          countries: [],
          continents: [],
          scope: item.name,
        };
      }
      onPostSettingsCallback(currState);
      return currState;
    });
    // toggleDrawer(ev, false);
  };

  const onToggleCountry = (id: string) => {
    setState((prev) => {
      let currState = prev;
      if (prev.countries.includes(id)) {
        currState = {
          ...prev,
          countries: prev.countries.filter((c) => c !== id),
        };
      } else {
        currState = { ...prev, countries: [...prev.countries, id] };
      }
      onPostSettingsCallback(currState);
      return currState;
    });
  };

  const onToggleContinent = (id: string) => {
    setState((prev) => {
      let currState = prev;
      if (prev.continents.find((c) => c === id)) {
        currState = {
          ...prev,
          continents: prev.continents.filter((c) => c !== id),
        };
      } else {
        currState = { ...prev, continents: [...prev.continents, id] };
      }
      onPostSettingsCallback(currState);
      return currState;
    });
  };

  const onSave = (ev: React.SyntheticEvent<{}, Event>) => {
    if (state.scope === PostScopeEnum.COUNTRY && state.countries.length === 0) {
      return notif.show(<Typography sx={{zIndex: 999999}}>Please select a country or other type</Typography>, {
        severity: "warning",
        autoHideDuration: 2000,
      });
    }
    if (
      state.scope === PostScopeEnum.CONTINENT &&
      state.continents.length === 0
    ) {
      return notif.show("Please select a continent or other type", {
        severity: "warning",
        autoHideDuration: 2000,
      });
    }
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
      onClose={(ev) => onSave(ev)}
      onOpen={(ev) => {}}
      slotProps={{
        paper: {
          sx: {
            top: { lg: "45%", md: "45%", sm: "35%", xs: "35%" },
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
        {/* <Stack direction={"row"} sx={{ justifyContent: "flex-end", mx: 1, py: 1 }}> */}
        <Box sx={{ position: "absolute", right: 10, top: 8 }}>
          <Button
            onClick={(ev) => onSave(ev)}
            sx={{ borderRadius: 30 }}
            variant="outlined"
            size="small"
          >
            Save
          </Button>
        </Box>
        {/* </Stack> */}
        <Container maxWidth="xl" sx={{ mt: 0, pb: 2 }}>
          <Box>
            <Typography
              sx={{ textAlign: "center", fontFamily: "PlayFair" }}
              variant="h6"
            >
              Who can reply?
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontFamily: "PlayFair", pt: 0.5 }}
              variant="body2"
            >
              Choose who can reply to this post. Acounts mentioned or tagged can
              always reply
            </Typography>
          </Box>
          {!state.showSelection && (
            <List sx={{ width: "100%" }}>
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
                        checked={item.name === state.scope}
                        slotProps={{ input: { "aria-labelledby": item.id } }}
                      />
                    </ListItemIcon>
                    <ListItemText id={item.id} primary={item.title} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
          {state.showSelection && (
            <Box sx={{ position: "relative" }}>
              <Stack
                direction={"row"}
                spacing={1}
                sx={{
                  alignItems: "center",
                  my: 1
                }}>
                <Box>
                  <IconButton aria-label="Go back"
                    onClick={(ev) => {
                      ev.preventDefault();
                      setState((prev) => ({ ...prev, showSelection: false }));
                    }}
                  >
                    <ArrowBackOutlined />
                  </IconButton>
                </Box>
                <Typography color="textSecondary">
                  Select{" "}
                  {PostScopeEnum.COUNTRY === state.scope
                    ? "country"
                    : "continent"}{" "}
                </Typography>
              </Stack>
              {/* {!data && isLoading && <DisplaySkeleton />} */}
              {PostScopeEnum.COUNTRY === state.scope && (
                <DisplayCountries
                  countries={countries}
                  onToggleCountry={onToggleCountry}
                  selected={state.countries}
                  height={300}
                />
              )}

              {PostScopeEnum.CONTINENT === state.scope && (
                <DisplayContinents
                  continents={continents}
                  onToggleContinent={onToggleContinent}
                  selected={state.continents}
                  height={300}
                />
              )}
            </Box>
          )}
        </Container>
      </Box>
    </SwipeableDrawer>
  );
};

export default PostSettingsDrawer;
