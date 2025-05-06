"use client";
import {
  Box,
  Container,
  IconButton,
  SwipeableDrawer,
  Stack,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  SelectChangeEvent,
  Typography,
  Grid,
  Button,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import React, { useState } from "react";
import { PollDuration } from "@/types/post";

// type PollDuration = {
//   days: number;
//   hours: number;
//   minutes: number;
// };

const durationOptions = {
  days: Array.from({ length: 8 }).map((_d, i) => i),
  hours: Array.from({ length: 24 }).map((_d, i) => i),
  minutes: Array.from({ length: 60 }).map((_d, i) => i),
};

const PollDurationDrawer = ({
  isOpen,
  toggleDrawer,
  onPollDurationCallback,
  threadId,
  duration,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  threadId: number;
  onPollDurationCallback: (threadId: number, duration: PollDuration) => void;
  duration: PollDuration;
}) => {
  const open = React.useMemo(() => isOpen, [isOpen]);

  const [state, setState] = useState<{
    duration: PollDuration;
  }>({ duration });

  const handleChange = (ev: SelectChangeEvent<number>) => {
    setState((prev) => {
      const obj = {
        ...prev,
        duration: {
          ...prev.duration,
          [ev.target.name]: parseInt(ev.target.value.toString(), 10),
        },
      };

      let { days, hours, minutes } = obj.duration;

      const totalMinutes = days * 24 * 60 + hours * 60 + minutes;

      const maxMinutes = 7 * 24 * 60; // 7 days in minutes

      // Ensure the total duration does not exceed 7 days
      if (totalMinutes > maxMinutes) {
        days = 7;
        hours = 0;
        minutes = 0;
      } else if (days === 6 && hours >= 24) {
        // If 6 days are selected and hours exceed 23, reset to 7 days
        days = 7;
        hours = 0;
        minutes = 0;
      } else if (days === 0 && hours === 0 && minutes < 5) {
        // Ensure minimum duration is 5 minutes if days & hours are 0
        minutes = 5;
      }

      return {
        ...prev,
        duration: { days, hours, minutes },
      };
    });
  };

  const onSave = (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    onPollDurationCallback(threadId, state.duration);
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
        <Stack
          direction={"row"}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            mx: 1,
            my: 1,
          }}
        >
          <IconButton color="inherit" onClick={(ev) => toggleDrawer(ev, false)}>
            <Close />
          </IconButton>
          <Typography>Set Duration</Typography>
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
        <Container maxWidth="xl" sx={{ mt: 0, pb: 2 }}>
          <Box component="form" sx={{}}>
            <Grid container spacing={1}>
              <Grid size={{ lg: 4, md: 4, sm: 4, xs: 4 }}>
                <FormControl fullWidth>
                  <InputLabel htmlFor="days">Days</InputLabel>
                  <Select
                    name="days"
                    size="small"
                    native
                    value={state.duration.days}
                    onChange={(ev) => handleChange(ev)}
                    input={<OutlinedInput label="Day" id="days" />}
                  >
                    {durationOptions.days.map((item, i) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ lg: 4, md: 4, sm: 4, xs: 4 }}>
                <FormControl fullWidth>
                  <InputLabel id="hours">Hours</InputLabel>
                  <Select
                    size="small"
                    labelId="hours"
                    value={state.duration.hours}
                    onChange={(ev) => handleChange(ev)}
                    name="hours"
                    native
                    input={<OutlinedInput label="Hours" id="hours" />}
                  >
                    {durationOptions.hours.map((item, i) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ lg: 4, md: 4, sm: 4, xs: 4 }}>
                <FormControl fullWidth>
                  <InputLabel id="minutes">Minutes</InputLabel>
                  <Select
                    size="small"
                    labelId="minutes"
                    value={state.duration.minutes}
                    onChange={(ev) => handleChange(ev)}
                    name="minutes"
                    native
                    input={<OutlinedInput label="Minutes" id="minutes" />}
                  >
                    {durationOptions.minutes.map((item, i) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>
    </SwipeableDrawer>
  );
};

export default PollDurationDrawer;
