"use client";
import {
  Box,
  Container,
  IconButton,
  SwipeableDrawer,
  Stack,
  Typography,
  FormControl,
  Button,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import React, { useState } from "react";

import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { formatDateTime } from "@/utils";




const PostScheduleDrawer = ({
  isOpen,
  toggleDrawer,
  scheduleAt,
  onPostScheduleCallback
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  scheduleAt?: string | Date;
  onPostScheduleCallback: (scheduleAt?: string | Date) => void
}) => {
  const open = React.useMemo(() => isOpen, [isOpen]);

  const [state, setState] = useState<{scheduleDate: Dayjs | null}>({ 
    scheduleDate: scheduleAt ? dayjs(scheduleAt) :   dayjs().add(30, "minute"), 
  });

  const handleSelected = (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    ev.preventDefault()
    onPostScheduleCallback(!state.scheduleDate ? undefined : state.scheduleDate?.toISOString());
    // toggleDrawer(ev, false);
  };

  const clearSchedule = (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    ev.preventDefault()
    onPostScheduleCallback(undefined);
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
      onClose={(ev) => {}}
      onOpen={(ev) => {}}
      // hideBackdrop={true}
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
          <Typography>Schedule Thread?</Typography>
          <Button
            size="small"
            color="primary"
            variant="contained"
            sx={{ borderRadius: 30 }}
            onClick={(ev) => handleSelected(ev)}
          >
            Save
          </Button>
        </Stack>
        <Container maxWidth="xl" sx={{ mt: 0, pb: 2 }}>
          <Box>
            <Typography
              color="textDisabled"
              sx={{ fontFamily: "PlayFair", py: 2 }}
              variant="subtitle1"
            >
              Choose when to go public
            </Typography>
          </Box>
            <Box>
            <FormControl fullWidth sx={{ mb: 2, zIndex: 999999999 }}>
              <LocalizationProvider  dateAdapter={AdapterDayjs}>
              <DateTimePicker
                    label="Schedule At"
                    value={state.scheduleDate}
                    onChange={(newValue) =>
                      setState((prev) => ({ ...prev, scheduleDate: newValue }))
                    }
                    disablePast
                    slotProps={{
                      popper: {
                        sx: {
                          zIndex: 9999999999, // Higher than your drawer
                        },
                      
                      },
                      mobilePaper: {
                        sx: {
                          zIndex: 9999999999, // For mobile (dialog-based)
                          position: "relative", // Prevent clipping
                        },
                        
                      },                  
                      dialog:{
                        sx: {
                          zIndex: 9999999999, // For desktop (modal-based)
                        }
                      }
                    }}
                  />
              </LocalizationProvider>
            </FormControl>
            </Box>
            {scheduleAt && <Box>
              <Typography>You scheduled your post to go live on {formatDateTime(scheduleAt)}</Typography>
                <Stack direction={"row"} alignItems={"center"}>
                  <Typography color="error">Clear schedule</Typography>
                  <IconButton color="error" onClick={(ev) => clearSchedule(ev)}>
                    <Close />
                  </IconButton>
                </Stack>
              </Box>}
        </Container>
      </Box>
    </SwipeableDrawer>
  );
};

export default PostScheduleDrawer;
