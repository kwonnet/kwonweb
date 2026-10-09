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
  TextField,
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

import useSWR from "swr";
import { getContinentsAndCountries } from "@/lib/locations";
import { Continent, Country } from "@/types";
import { toast } from "react-toastify";
import { useAuthSession } from "@/hooks";
import { useNotifications } from "@/providers/NotificationsProvider";
import { QuizScopeEnum, QuizThread } from "@/types/post";
import DisplayCountries from "./DisplayCountries";
import DisplayContinents from "./DisplayContinents";
import DisplaySkeleton from "./DisplaySkeleton";

// const DisplaySkeleton = () => {
//   return (
//     <React.Fragment>
//       {Array.from({ length: 6 }).map((item, index) => (
//         <ListItem key={index} disablePadding>
//           <ListItemButton dense>
//             <ListItemIcon>
//               <Skeleton variant="circular" width={24} height={24} />
//             </ListItemIcon>
//             <ListItemText>
//               <Skeleton variant="text" width="80%" height={24} />
//             </ListItemText>
//             <IconButton edge="start">
//               <Skeleton variant="circular" width={32} height={32} />
//             </IconButton>
//           </ListItemButton>
//         </ListItem>
//       ))}
//     </React.Fragment>
//   );
// };

// const DisplayCountries = ({
//   countries,
//   onToggleCountry,
//   selected,
// }: {
//   countries: Country[];
//   onToggleCountry: (id: string) => void;
//   selected: string[];
// }) => {
//   const theme = useTheme();
//   const isMDDown = useMediaQuery(theme.breakpoints.down("md"));

//   const RenderItem = ({ index, style }: ListChildComponentProps) => {
//     const item = countries[index];
//     return (
//       <ListItem
//         style={style}
//         key={item.id}
//         secondaryAction={
//           <IconButton edge="start" aria-label={`${item.name} flag`}>
//             {item.emoji}
//           </IconButton>
//         }
//         disablePadding
//       >
//         <ListItemButton
//           role={undefined}
//           onClick={(ev) => onToggleCountry(item.id)}
//           dense
//         >
//           <ListItemIcon>
//             <Checkbox
//               edge="end"
//               checked={selected.includes(item.id)}
//               tabIndex={-1}
//               disableRipple
//               inputProps={{ "aria-labelledby": item.id }}
//             />
//           </ListItemIcon>
//           <ListItemText id={item.id} primary={item.name} />
//         </ListItemButton>
//       </ListItem>
//     );
//   };
//   return (
//     <Box
//       sx={{
//         width: "100%",
//       }}
//     >
//       <FixedSizeList
//         height={isMDDown ? 250 : 250}
//         width={"100%"}
//         itemSize={50}
//         itemCount={countries.length}
//         overscanCount={5}
//       >
//         {RenderItem}
//       </FixedSizeList>
//     </Box>
//   );
// };

// const DisplayContinents = ({
//   continents,
//   onToggleContinent,
//   selected,
// }: {
//   continents: Continent[];
//   onToggleContinent: (id: string) => void;
//   selected: string[];
// }) => {
//   const theme = useTheme();
//   const isMDDown = useMediaQuery(theme.breakpoints.down("md"));
//   const RenderItem = ({ index, style }: ListChildComponentProps) => {
//     const item = continents[index];
//     return (
//       <ListItem
//         style={style}
//         key={item.id}
//         secondaryAction={
//           <IconButton
//             size="small"
//             edge="start"
//             aria-label={`${item.name} code`}
//           >
//             {item.code}
//           </IconButton>
//         }
//         disablePadding
//       >
//         <ListItemButton
//           role={undefined}
//           onClick={(ev) => onToggleContinent(item.id)}
//           dense
//         >
//           <ListItemIcon>
//             <Checkbox
//               edge="end"
//               checked={selected.includes(item.id)}
//               tabIndex={-1}
//               disableRipple
//               inputProps={{ "aria-labelledby": item.id }}
//             />
//           </ListItemIcon>
//           <ListItemText id={item.id} primary={item.name} />
//         </ListItemButton>
//       </ListItem>
//     );
//   };
//   return (
//     <Box
//       sx={{
//         width: "100%",
//       }}
//     >
//       <FixedSizeList
//         height={isMDDown ? 250 : 250}
//         width={"100%"}
//         itemSize={50}
//         itemCount={continents.length}
//         overscanCount={5}
//       >
//         {RenderItem}
//       </FixedSizeList>
//     </Box>
//   );
// };

const QuizSettingsDrawer = ({
  isOpen,
  toggleDrawer,
  threadId,
  onQuizCallback,
  quiz,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  threadId: number;
  onQuizCallback: (threadId: number, quiz: Partial<QuizThread>) => void;
  quiz: QuizThread;
}) => {
  const { token } = useAuthSession();

  const notif = useNotifications();

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
    isPaid: boolean;
    scope: QuizScopeEnum;
    countries: string[];
    continents: string[];
    rewardAmount: number;
    maxWinners: number;
  }>({
    ...quiz,
  });

  const handleQuizChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, isPaid: !prev.isPaid }));
  };

  const handleScopeChange = (
    ev: React.ChangeEvent<HTMLInputElement>,
    val: string
  ) => {
    const scope = val as QuizScopeEnum;
    setState((prev) => {
      if (scope === QuizScopeEnum.NONE) {
        return { ...prev, scope, continents: [], countries: [] };
      }
      if (scope === QuizScopeEnum.COUNTRY) {
        return { ...prev, scope, continents: [] };
      }
      if (scope === QuizScopeEnum.CONTINENT) {
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
    if (state.scope === QuizScopeEnum.COUNTRY && state.countries.length === 0) {
      return notif.show("Please select a country or select none", {
        severity: "warning",
        autoHideDuration: 2000,
      });
    }
    if (
      state.scope === QuizScopeEnum.CONTINENT &&
      state.continents.length === 0
    ) {
      return notif.show("Please select a continent or select none", {
        severity: "warning",
        autoHideDuration: 2000,
      });
    }
    
    const isMax =
      state.continents.length === continents.length ||
      state.continents.length === countries.length;
    onQuizCallback(threadId, {
      scope: isMax ? QuizScopeEnum.NONE : state.scope,
      continents: isMax ? [] : state.continents,
      countries: isMax ? [] : state.countries,
      isPaid: state.isPaid,
      rewardAmount: !state.isPaid ? 0 : state.rewardAmount,
      maxWinners: !state.isPaid ? 0 : state.maxWinners
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
            top: { lg: "25%", md: "25%", sm: "10%", xs: "10%" },
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
            <IconButton aria-label="Close"
              color="inherit"
              onClick={(ev) => toggleDrawer(ev, false)}
            >
              <Close />
            </IconButton>
            <Typography>Quiz Settings</Typography>
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
        <Divider variant="fullWidth" />
        <Container
          maxWidth="xl"
          sx={{ mt: 1, pb: 2, marginBottom: 20, position: "relative" }}
        >
          <Stack direction={"row"} sx={{ justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ fontFamily: "PlayFair" }} variant="subtitle1">
                is this free or rewarded quiz?
              </Typography>
              <Typography
                color={!state.isPaid ? "warning" : "textDisabled"}
                variant="caption"
                sx={{ fontFamily: "PlayFair", textWrap: "nowrap" }}
              >
                {!state.isPaid
                  ? "Note: No reward will be shared for free quiz."
                  : "Reward amount will be shared to the winners."}
              </Typography>
            </Box>
            <Switch
              value={state.isPaid}
              onChange={(ev) => handleQuizChange(ev)}
            />
          </Stack>
          {
            <Box>
              <FormControl size="small" fullWidth sx={{ mb: 0.5 }}>
                <TextField
                  value={state.rewardAmount}
                  onChange={(ev) =>
                    setState((prev) => ({
                      ...prev,
                      rewardAmount: parseInt(ev.target.value),
                    }))
                  }
                  placeholder="Enter reward amount"
                  type="number"
                  helperText={
                    <Typography sx={{ textWrap: "nowrap" }} variant="caption">
                      Amount will be randomly shared to the winners
                    </Typography>
                  }
                />
              </FormControl>
              <FormControl size="small" fullWidth sx={{ mb: 0.5 }}>
                <TextField
                  placeholder="Enter max winners"
                  type="number"
                  value={state.maxWinners}
                  onChange={(ev) =>
                    setState((prev) => ({
                      ...prev,
                      maxWinners: parseInt(ev.target.value),
                    }))
                  }
                  helperText={
                    <Typography variant="caption">
                      Limit the number of winners to be rewarded
                    </Typography>
                  }
                />
              </FormControl>
            </Box>
          }
          <Box sx={{ position: "relative" }}>
            <FormControl>
              <FormLabel sx={{ fontFamily: "PlayFair" }} id="quiz-scope">
                Limit Quiz Scope?
              </FormLabel>
              <RadioGroup
                onChange={(ev, val) => handleScopeChange(ev, val)}
                row
                value={state.scope}
                aria-labelledby="quiz-scope"
                name="quiz-scope"
                sx={{ flexWrap: "nowrap" }}
              >
                <FormControlLabel
                  value={QuizScopeEnum.NONE}
                  control={<Radio size="small" />}
                  label={QuizScopeEnum.NONE}
                />
                <FormControlLabel
                  value={QuizScopeEnum.COUNTRY}
                  control={<Radio size="small" />}
                  label={QuizScopeEnum.COUNTRY}
                />
                <FormControlLabel
                  value={QuizScopeEnum.CONTINENT}
                  control={<Radio size="small" />}
                  label={QuizScopeEnum.CONTINENT}
                />
              </RadioGroup>
            </FormControl>
          </Box>
          <Box sx={{ position: "relative" }}>
            {!data && isLoading && <DisplaySkeleton />}
            {QuizScopeEnum.COUNTRY === state.scope && (
              <DisplayCountries
                countries={countries}
                onToggleCountry={onToggleCountry}
                selected={state.countries}
              />
            )}

            {QuizScopeEnum.CONTINENT === state.scope && (
              <DisplayContinents
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

export default QuizSettingsDrawer;
