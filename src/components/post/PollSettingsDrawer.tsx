"use client";
import {
  Box,
  Container,
  IconButton,
  SwipeableDrawer,
  Stack,
  Typography,
  Switch,
  ListItemIcon,
  Checkbox,
  Divider,
  Skeleton,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import React, { useState } from "react";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import DisplayCountries from "./DisplayCountries";
import DisplayContinents from "./DisplayContinents";
import useSWR from "swr";
import { getContinentsAndCountries } from "@/lib/locations";
import { Continent, Country } from "@/types";
import { toast } from "react-toastify";
import { useAuthSession } from "@/hooks";
import { useNotifications } from "@/providers/NotificationsProvider"
import { PollScopeEnum, PollThread } from "@/types/post";


const DisplaySkeleton = () => {
  return (
    <React.Fragment>
      {Array.from({ length: 6 }).map((item, index) => (
        <ListItem key={index} disablePadding>
          <ListItemButton dense>
            <ListItemIcon>
              <Skeleton variant="circular" width={24} height={24} />
            </ListItemIcon>
            <ListItemText>
              <Skeleton variant="text" width="80%" height={24} />
            </ListItemText>
            <IconButton edge="start">
              <Skeleton variant="circular" width={32} height={32} />
            </IconButton>
          </ListItemButton>
        </ListItem>
      ))}
    </React.Fragment>
  );
};

const PollSettingsDrawer = ({
  isOpen,
  toggleDrawer,
  threadId,
  onPollCallback,
  poll,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  threadId: number;
  onPollCallback: (threadId: number, poll: Partial<PollThread>) => void;
  poll: PollThread;
}) => {
  const { token } = useAuthSession();
  const theme = useTheme();
  const isMDDown = useMediaQuery(theme.breakpoints.down("md"));

  const notif =  useNotifications()

  const { data, isLoading } = useSWR(`/continents`, () =>
    getContinentsAndCountries(token)
  );

  const countries: Country[] =
    !data && isLoading
      ? []
      : (data
          ?.map((item) => item.countries)
          .flatMap((item) => item)
          ?.sort((a, b) => a.name.localeCompare(b.name)) ?? []);

  const continents: Continent[] =
    !data && isLoading
      ? []
      : (data?.sort((a, b) => a.name.localeCompare(b.name)) ?? []);

  const open = React.useMemo(() => isOpen, [isOpen]);

  const [state, setState] = useState<{
    isMultiVote: boolean;
    scope: PollScopeEnum;
    countries: string[];
    continents: string[];
  }>({
    ...poll,
  });

  const handleMultiVoteChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, isMultiVote: !prev.isMultiVote }));
  };

  const handleScopeChange = (
    ev: React.ChangeEvent<HTMLInputElement>,
    val: string
  ) => {
    const scope = val as PollScopeEnum;
    setState((prev) => {
      if (scope === PollScopeEnum.NONE) {
        return { ...prev, scope, continents: [], countries: [] };
      }
      if (scope === PollScopeEnum.COUNTRY) {
        return { ...prev, scope, continents: [] };
      }
      if (scope === PollScopeEnum.CONTINENT) {
        return { ...prev, scope, countries: [] };
      }
      return prev;
    });
  };

  const onToggleCountry = (id: string) => {
    setState((prev) => {
      if (prev.countries.includes(id)) {
        return {
          ...prev,
          countries: prev.countries.filter((c) => c !== id),
        };
      }
      return { ...prev, countries: [...prev.countries, id] };
    });
  };

  const onToggleContinent = (id: string) => {
    setState((prev) => {
      if (prev.continents.find((c) => c === id)) {
        return {
          ...prev,
          continents: prev.continents.filter((c) => c !== id),
        };
      }
      return { ...prev, continents: [...prev.continents, id] };
    });
  };

  const onSave = (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (state.scope === PollScopeEnum.COUNTRY && state.countries.length === 0) {
      return notif.show("Please select a country or select none", {
        severity: "warning",
        autoHideDuration: 2000
      });
    }
    if (state.scope === PollScopeEnum.CONTINENT && state.continents.length === 0) {
      return notif.show("Please select a continent or select none", {
        severity: "warning",
        autoHideDuration: 2000
      });
    }
    const isMax =
      state.continents.length === continents.length ||
      state.continents.length === countries.length;
    onPollCallback(threadId, {
      scope: isMax ? PollScopeEnum.NONE : state.scope,
      continents: isMax ? [] : state.continents,
      countries: isMax ? [] : state.countries,
      isMultiVote: state.isMultiVote,
    });
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
      // PaperProps={{
      //   sx: {
      //     top: "10%",
      //     borderTopLeftRadius: "8px",
      //     borderTopRightRadius: "8px",
      //     zIndex: 999,
      //     overflow: "hidden",
      //   },
      // }}
    >
      <Box sx={{ width: "auto", position: "relative" }} role="presentation">
        <Box sx={{ position: "relative" }}>
          <Stack
            direction={"row"}
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              mx: 1,
              my: 1,
            }}
          >
            <IconButton
              color="inherit"
              onClick={(ev) => toggleDrawer(ev, false)}
            >
              <Close />
            </IconButton>
            <Typography>Poll Settings</Typography>
            <Button
              size="small"
              color="primary"
              variant="contained"
              sx={{ borderRadius: 30 }}
              onClick={(ev) => onSave(ev)}
            >
              Save
            </Button>
          </Stack>
        </Box>
        <Container
          maxWidth="xl"
          sx={{ mt: 0, pb: 2, marginBottom: 20, position: "relative" }}
        >
          <Stack direction={"row"} sx={{ justifyContent: "space-between" }}>
            <Typography sx={{ fontFamily: "PlayFair" }} variant="subtitle1">
              Allow multiple selection?
            </Typography>
            <Switch
              value={state.isMultiVote}
              onChange={(ev) => handleMultiVoteChange(ev)}
            />
          </Stack>
          <Divider variant="fullWidth" />
          <Box sx={{ position: "relative" }}>
            <FormControl>
              <FormLabel sx={{ fontFamily: "PlayFair" }} id="poll-scope">
                Limit Poll Scope?
              </FormLabel>
              <RadioGroup
                onChange={(ev, val) => handleScopeChange(ev, val)}
                row
                value={state.scope}
                aria-labelledby="poll-scope"
                name="poll-scope"
              >
                <FormControlLabel
                  value={PollScopeEnum.NONE}
                  control={<Radio size="small" />}
                  label={PollScopeEnum.NONE}
                />
                <FormControlLabel
                  value={PollScopeEnum.COUNTRY}
                  control={<Radio size="small" />}
                  label={PollScopeEnum.COUNTRY}
                />
                <FormControlLabel
                  value={PollScopeEnum.CONTINENT}
                  control={<Radio size="small" />}
                  label={PollScopeEnum.CONTINENT}
                />
              </RadioGroup>
            </FormControl>
          </Box>
          <Box sx={{ position: "relative" }}>
            {!data && isLoading && <DisplaySkeleton />}
            {PollScopeEnum.COUNTRY === state.scope && (
              <DisplayCountries height={isMDDown ? 360 : 250}
                countries={countries}
                onToggleCountry={onToggleCountry}
                selected={state.countries}
              />
            )}

            {PollScopeEnum.CONTINENT === state.scope && (
              <DisplayContinents height={isMDDown ? 360 : 250}
                continents={continents}
                onToggleContinent={onToggleContinent}
                selected={state.continents}
              />
            )}
          </Box>
        </Container>
      </Box>
    </SwipeableDrawer>
  );
};

export default PollSettingsDrawer;
