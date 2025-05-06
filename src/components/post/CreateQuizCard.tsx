"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import {
  Card,
  CardContent,
  Checkbox,
  FormControl,
  Grid,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
// import { useAuth } from "@/hooks";
import { useRouter } from "next/navigation";
import {
  QuizDurationDrawer,
  QuizSettingsDrawer,
} from "@/components/post";
import { nanoid } from "nanoid";
import {
  AddOutlined,
  SettingsOutlined,
  AccessAlarmOutlined,
  DeleteOutlineOutlined,
  CheckBox,
} from "@mui/icons-material";
import { useAuthSession } from "@/hooks";
import { QuizDuration, QuizOption, QuizThread } from "@/types/post";


const CreateQuizCard = ({
  threadId,
  onQuizOptionCallback,
  onQuizCallback,
  onQuizDurationCallback,
  quiz,
}: {
  threadId: number;
  onQuizOptionCallback: (threadId: number, options: QuizOption[]) => void;
  onQuizCallback: (threadId: number, quiz: Partial<QuizThread>) => void;
  onQuizDurationCallback: (threadId: number, duration: QuizDuration) => void;
  quiz: QuizThread;
}) => {
  const router = useRouter();

    const { token, user } = useAuthSession();

  const [state, setState] = useState({
    options: [
      { id: nanoid(), text: "", isCorrect: false },
      { id: nanoid(), text: "", isCorrect: false },
    ],
    optionsLimit: 5,
    textCount: 30,
    openQuizSettings: false,
    openQuizDuration: false,
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
          isCorrect: false
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

    onQuizOptionCallback(
      threadId,
      state.options.map((choice) =>
        choice.id === id ? { ...choice, text: val, } : choice
      )
    );
  };

  const handleChange = (id: string, checked: boolean) => {
    setState(prev => ({...prev, options: prev.options.map((choice) =>
      choice.id === id ? { ...choice, isCorrect: checked } : choice
    )}))
    onQuizOptionCallback(
      threadId,
      state.options.map((choice) =>
        choice.id === id ? { ...choice, isCorrect: checked } : choice
      )
    );
  }

  const onDeleteOption = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string
  ) => {
    ev.preventDefault();
    setState((prev) => ({
      ...prev,
      options: prev.options.filter((item) => item.id !== id),
    }));
    onQuizOptionCallback(
      threadId,
      state.options.filter((item) => item.id !== id)
    );
  };

  const onOpenQuizSettings = (threadId: number) => {
    setState((prev) => ({ ...prev, threadId, openQuizSettings: true }));
  };
  const onOpenQuizDuration = (threadId: number) => {
    setState((prev) => ({ ...prev, threadId, openQuizDuration: true }));
  };

  const toggleQuizSettingsDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, openQuizSettings: open }));
  };

  const toggleQuizDurationDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, openQuizDuration: open }));
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
          <Typography variant="caption">Create options and mark the correct answer(s)</Typography>
          {state.options.map((item, index) => (
            <Grid key={item.id} container sx={{ alignItems: "center", pt: 1 }} spacing={2}>
              <Grid size={{ lg: 9, md: 9, sm: 9, xs: 9 }}>
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
              <Grid sx={{ lg: 3, md: 3, sm: 3, xs: 3 }}>
                <Stack direction={"row"} sx={{alignItems: "center"}} spacing={1}>
                <Checkbox
                    size="small"
                    checked={item.isCorrect}
                    onChange={(ev, checked) => handleChange(item.id, checked)}
                    slotProps={{ input: { 'aria-label': 'controlled' }}}
                  />
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
                </Stack>
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
                  onOpenQuizDuration(threadId);
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
                  onOpenQuizSettings(threadId);
                }}
                direction={"row"}
                sx={{ alignItems: "center" }}
              >
                <Tooltip title="Quiz setting">
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
      {/* quiz duration drawer */}
      <QuizDurationDrawer
        isOpen={state.openQuizDuration}
        toggleDrawer={toggleQuizDurationDrawer}
        threadId={threadId}
        onQuizDurationCallback={onQuizDurationCallback}
        duration={quiz.duration}
      />
      {/* quiz settings drawer */}
      <QuizSettingsDrawer
        isOpen={state.openQuizSettings}
        toggleDrawer={toggleQuizSettingsDrawer}
        threadId={threadId}
        onQuizCallback={onQuizCallback}
        quiz={quiz}
      />
    </React.Fragment>
  );
};

export default CreateQuizCard;
