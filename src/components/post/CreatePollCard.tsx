"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import {
  Card,
  CardContent,
  FormControl,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
// import { useAuth } from "@/hooks";
import { useRouter } from "next/navigation";
import PollDurationDrawer from "@/components/post/PollDurationDrawer";
import PollSettingsDrawer from "@/components/post/PollSettingsDrawer";
import { nanoid } from "nanoid";
import {
  AddOutlined,
  SettingsOutlined,
  AccessAlarmOutlined,
  DeleteOutlineOutlined,
} from "@mui/icons-material";
import { useAuthSession } from "@/hooks";
import { PollDuration, PollOption, PollThread } from "@/types/post";


const CreatePollCard = ({
  threadId,
  onPollOptionCallback,
  onPollCallback,
  onPollDurationCallback,
  poll,
}: {
  threadId: number;
  onPollOptionCallback: (threadId: number, options: PollOption[]) => void;
  onPollCallback: (threadId: number, poll: Partial<PollThread>) => void;
  onPollDurationCallback: (threadId: number, duration: PollDuration) => void;
  poll: PollThread;
}) => {
  const router = useRouter();

    const { token, user } = useAuthSession();

  const [state, setState] = useState({
    options: [
      { id: nanoid(), text: "" },
      { id: nanoid(), text: "" },
    ],
    optionsLimit: 5,
    textCount: 30,
    openPollSettings: false,
    openPollDuration: false,
  });

  const onAddOption = (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    ev.preventDefault();
    setState((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          id: nanoid(),
          text: "",
        },
      ],
    }));
  };

  const onChangeOption = (
    ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: string
  ) => {
    const val = ev.target.value?.substring(0, state.textCount);
    setState((prev) => ({
      ...prev,
      options: prev.options.map((choice) =>
        choice.id === id ? { ...choice, text: val } : choice
      ),
    }));

    onPollOptionCallback(
      threadId,
      state.options.map((choice) =>
        choice.id === id ? { ...choice, text: val } : choice
      )
    );
  };

  const onDeleteOption = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string
  ) => {
    ev.preventDefault();
    setState((prev) => ({
      ...prev,
      options: prev.options.filter((item) => item.id !== id),
    }));
    onPollOptionCallback(
      threadId,
      state.options.filter((item) => item.id !== id)
    );
  };

  const onOpenPollSettings = (threadId: number) => {
    setState((prev) => ({ ...prev, threadId, openPollSettings: true }));
  };
  const onOpenPollDuration = (threadId: number) => {
    setState((prev) => ({ ...prev, threadId, openPollDuration: true }));
  };

  const togglePollSettingsDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, openPollSettings: open }));
  };

  const togglePollDurationDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, openPollDuration: open }));
  };

  return (
    <React.Fragment>
      <Card
        elevation={0}
        sx={[
          (theme) => ({
            borderRadius: 3,
            mt: 0,
            mb: 0,
            pt: 0,
            pb: 0,
            py: 1,
            border: `0.1px solid #b6b6bc`,
            ...theme.applyStyles("dark", {
              border: `0.1px solid #46454d`,
            }),
            px: 1,
          }),
        ]}
      >
        <CardContent
          sx={{
            pt: 0.3,
            mt: 0,
            ml: 0,
            mr: 0,
            p: 0,
            maxWidth: "100%",
            "&:last-child": { pb: 0 },
          }}
        >
          {state.options.map((item, index) => (
            <Grid key={item.id} container sx={{ alignItems: "center", pt: 1 }} spacing={2}>
              <Grid size={{ lg: 10, md: 10, sm: 10, xs: 10 }}>
                <FormControl key={item.id} fullWidth sx={{ mb: 0.5 }}>
                  <TextField
                    size="small"
                    variant="outlined"
                    value={item.text}
                    onChange={(ev) => onChangeOption(ev, item.id)}
                    placeholder={`Choice ${index + 1}`}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <Typography
                            sx={{ pl: 0.7 }}
                            variant="caption"
                            color="textDisabled"
                          >
                            {state.textCount - item.text.length}
                          </Typography>
                        ),
                      },
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid sx={{ lg: 2, md: 2, sm: 2, xs: 2 }}>
                {index > 1 && (
                  <Tooltip title="Add option">
                    <IconButton
                      onClick={(ev) => onDeleteOption(ev, item.id)}
                      disableRipple
                      size="small"
                      sx={[
                        (theme) => ({
                          backgroundColor: "rgba(0, 0, 0, 0.1)",
                          padding: 0.5,
                          color: theme.vars.palette.secondary.main,
                          marginBottom: 0,
                          ...theme.applyStyles("dark", {
                            color: theme.vars.palette.grey[500],
                          }),
                        }),
                      ]}
                    >
                      <DeleteOutlineOutlined sx={{ height: 15, width: 15 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Grid>
            </Grid>
          ))}
          <Box sx={{ m: 0, p: 0, position: "relative", mt: 5 }}>
            <Stack
              direction={"row"}
              spacing={1}
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Stack
                direction={"row"}
                sx={{ alignItems: "center" }}
                onClick={(ev) => {
                  ev.preventDefault();
                  onOpenPollDuration(threadId);
                }}
              >
                <Tooltip title="Set Duration">
                  <IconButton
                    disableRipple
                    size="small"
                    sx={[
                      (theme) => ({
                        backgroundColor: "rgba(0, 0, 0, 0.1)",
                        padding: 0.5,
                        color: theme.vars.palette.secondary.main,
                        marginBottom: 0,
                        ...theme.applyStyles("dark", {
                          color: theme.vars.palette.grey[500],
                        }),
                      }),
                    ]}
                  >
                    <AccessAlarmOutlined sx={{ height: 15, width: 15 }} />
                  </IconButton>
                </Tooltip>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "PlayFair",
                    whiteSpace: "nowrap", // Prevents wrapping
                    overflow: "hidden", // Hides overflow text
                    textOverflow: "ellipsis", // Adds "..."
                    maxWidth: "100px", // Set a max width for truncation
                    display: "block", // Required for text-overflow to work
                  }}
                >
                  Duration
                </Typography>
              </Stack>
              <Stack
                onClick={(ev) => {
                  ev.preventDefault();
                  onOpenPollSettings(threadId);
                }}
                direction={"row"}
                sx={{ alignItems: "center" }}
              >
                <Tooltip title="Poll setting">
                  <IconButton
                    disableRipple
                    size="small"
                    sx={[
                      (theme) => ({
                        backgroundColor: "rgba(0, 0, 0, 0.1)",
                        padding: 0.5,
                        color: theme.vars.palette.secondary.main,
                        marginBottom: 0,
                        ...theme.applyStyles("dark", {
                          color: theme.vars.palette.grey[500],
                        }),
                      }),
                    ]}
                  >
                    <SettingsOutlined sx={{ height: 15, width: 15 }} />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" sx={{ fontFamily: "PlayFair" }}>
                  Setting
                </Typography>
              </Stack>
              <Tooltip title="Add option">
                <IconButton
                  disabled={state.options.length >= state.optionsLimit}
                  onClick={(ev) => onAddOption(ev)}
                  disableRipple
                  size="small"
                  sx={[
                    (theme) => ({
                      backgroundColor: "rgba(0, 0, 0, 0.1)",
                      padding: 0.5,
                      color: theme.vars.palette.secondary.main,
                      marginBottom: 0,
                      ...theme.applyStyles("dark", {
                        color: theme.vars.palette.grey[500],
                      }),
                    }),
                  ]}
                >
                  <AddOutlined sx={{ height: 15, width: 15 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </CardContent>
      </Card>
      {/* poll duration drawer */}
      <PollDurationDrawer
        isOpen={state.openPollDuration}
        toggleDrawer={togglePollDurationDrawer}
        threadId={threadId}
        onPollDurationCallback={onPollDurationCallback}
        duration={poll.duration}
      />
      {/* poll settings drawer */}
      <PollSettingsDrawer
        isOpen={state.openPollSettings}
        toggleDrawer={togglePollSettingsDrawer}
        threadId={threadId}
        onPollCallback={onPollCallback}
        poll={poll}
      />
    </React.Fragment>
  );
};

export default CreatePollCard;
