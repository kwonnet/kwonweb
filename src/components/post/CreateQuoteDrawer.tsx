"use client";
import {
  Box,
  Avatar,
  Container,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  Divider,
  Button,
  Dialog,
  DialogContent,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  InsertPhoto,
  AddPhotoAlternateOutlined,
  AddOutlined,
  DeleteOutlineOutlined,
  PollOutlined,
  Close,
  AccessAlarmOutlined,
} from "@mui/icons-material";
import React, { useState, useRef, useCallback } from "react";
import { genUniqueRef, getErrorMessage, shortenText } from "@/utils";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CarouselContainer from "./CarouselContainer";
import TagPeopleDrawer from "./TagPeopleDrawer";
import { createPost, createPostQuote } from "@/lib/posts";
// import { toast } from "react-toastify";
import CircularProgress, {
  CircularProgressProps,
} from "@mui/material/CircularProgress";
import { FeedPost, PostType } from "@/types";
import CreatePollCard from "./CreatePollCard";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";

import { debounce } from "lodash";
import PostSettingsDrawer from "./PostSettingsDrawer";
import { useAuthSession } from "@/hooks";
import ContentEditor from "./ContentEditor";
import PostScheduleDrawer from "./PostScheduleDrawer";
import PostLocationDrawer from "./PostLocationDrawer";
import {
  PollDuration,
  PollOption,
  PollScopeEnum,
  PollThread,
  PostCreate,
  PostScopeEnum,
  PostScopeSetting,
  PostThread,
  TagUser,
} from "@/types/post";
import { useNotifications } from "@/providers/NotificationsProvider";
import FeedQuoteItem from "./FeedQuoteItem";
import {
  uploadMultipleFilesWithMetadata,
} from "@/utils/r2-upload";
import { useVideoUploads } from "@/hooks/useVideoUploads";
import VideoUploadProgress from "@/components/common/VideoUploadProgress";
import { FollowAction } from "@/types/user";

function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number; max: number }
) {
  const progress =
    props.value === 0 ? 0 : Math.round((props.value / props.max) * 100);
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <Box
        sx={[
          (theme) => ({
            position: "relative",
            width: 25,
            height: 25,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
            border: "2px solid aliceblue",
            // backgroundColor: "rgba(0, 0, 0, 0.1)",
            color: theme.vars.palette.secondary.main,
            ...theme.applyStyles("dark", {
              color: theme.vars.palette.grey[500],
            }),
          }),
        ]}
      >
        <CircularProgress
          variant="determinate"
          value={progress}
          size={25}
          thickness={3}
          sx={[
            (theme) => ({
              position: "absolute",
              ...(progress === 100
                ? {
                    color: theme.vars.palette.error.light,
                  }
                : { color: theme.vars.palette.secondary.light }),
            }),
          ]}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <Typography
            variant="caption"
            component="div"
            sx={{ cursor: "pointer", fontSize: 8 }}
          >{`${progress}%`}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

type LocalState = {
  threads: PostThread[];
  loading: boolean;
  maxContent: number;
  threadId: number;
  threadIndex: number;
  scope: PostScopeEnum;
  location?: string;
  isOpenPostSettings: boolean;
  isOpenSchedule: boolean;
  scheduleAt?: string | Date;
  isOpenLocation?: boolean;
  isDraft: boolean;
};

const threadId = new Date().getTime();
const initialState: LocalState = {
  loading: false,
  isDraft: false,
  threadId: threadId,
  threadIndex: 0,
  scope: PostScopeEnum.ANYONE,
  threads: [
    {
      id: new Date().getTime(),
      content: "",
      files: [],
      type: PostType.CONTENT,
      poll: undefined,
      mentions: [],
      tags: [],
      tagUsers: [],
      isOpenTagUser: false,
    },
  ],
  maxContent: 300,
  isOpenPostSettings: false,
  isOpenSchedule: false,
};

const validateThreads = (threads: PostThread[]) => {
  const errors: string[] = [];

  threads.forEach((thread, index) => {
    // Check if content and files are both empty
    if (thread.type === PostType.CONTENT) {
      if (!thread.content.trim() && thread.files.length === 0) {
        errors.push(
          `Thread ${index + 1}: Content and files cannot both be empty.`
        );
      }
      if (thread.content.trim().length < 1 && thread.files.length === 0) {
        errors.push(
          `Thread ${index + 1}: Content must be at least 1 character.`
        );
      }
    }
    // If type is POLL, validate poll options
    if (thread.type === PostType.POLL) {
      if (thread.content.trim().length < 1) {
        errors.push(
          `Thread ${index + 1}: Content must be at least 1 character.`
        );
      }
      if (!thread.poll || thread.poll.options.length < 2) {
        errors.push(
          `Thread ${index + 1}: A poll must have at least two options.`
        );
      } else if (thread.poll.options.some((option) => !option.text.trim())) {
        errors.push(
          `Thread ${index + 1}: Poll options cannot have empty text.`
        );
      }
    }
  });

  return errors;
};

export default function CreateQuoteDrawer({
  isOpen,
  toggleDrawer,
  post,
  onQuoteCallback,
  onFollowUserCallback,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  post?: FeedPost;
  onQuoteCallback: (id: string, quoted: boolean) => void;
  onFollowUserCallback: (
    args: {
    senderId: string;
    recipientId: string;
    action: FollowAction;
    }
  ) => void;
}) {
  const open = React.useMemo(() => isOpen, [isOpen]);

  const { user, token } = useAuthSession();

  const [state, setState] = useState<LocalState>(initialState);
  const videoUploads = useVideoUploads(user?.id);

  const fileRef = useRef<HTMLInputElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const theme = useTheme();

  const notif = useNotifications();

  const isMDDown = useMediaQuery(theme.breakpoints.down("md"));

  const toggleTagPeopleDrawer = (threadId: number, isOpen: boolean) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((thread) =>
        thread.id === threadId ? { ...thread, isOpenTagUser: isOpen } : thread
      ),
    }));
  };

  const togglePostSettingsDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, isOpenPostSettings: open }));
  };

  const togglePostScheduleDrawer = (ev: any, open: boolean) => {
    ev?.preventDefault();
    setState((prev) => ({ ...prev, isOpenSchedule: open }));
  };
  const togglePostLocationDrawer = (ev: any, open: boolean) => {
    ev?.preventDefault();
    setState((prev) => ({ ...prev, isOpenLocation: open }));
  };

  const onThreadContentChange = (id: number, args: Partial<PostThread>) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((item) =>
        item.id === id ? { ...item, ...args } : item
      ),
    }));
  };

  const onTogglePoll = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: number
  ) => {
    ev.preventDefault();
    setState((prev) => {
      const poll: PollThread = {
        options: [],
        continents: [],
        countries: [],
        scope: PollScopeEnum.NONE,
        isMultiVote: false,
        duration: { days: 7, hours: 0, minutes: 0 },
      };
      return {
        ...prev,
        threads: prev.threads.map((item) =>
          item.id === id
            ? {
                ...item,
                ...(item.type === PostType.POLL
                  ? {
                      type: PostType.CONTENT,
                      files: [],
                      poll: undefined,
                    }
                  : {
                      type: PostType.POLL,
                      files: [],
                      poll,
                    }),
              }
            : item
        ),
      };
    });
  };

  const onSelectFile = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: number
  ) => {
    ev.preventDefault();
    document.getElementById(`input_${id}`)?.click();
  };

  const onFileChange = (
    ev: React.ChangeEvent<HTMLInputElement>,
    id: number
  ) => {
    ev.preventDefault();
    if (ev.target.files) {
      const files = Array.from(ev.target.files).map((file) => ({
        id: genUniqueRef(16),
        file,
        altText: "",
        flags: [],
      }));
      setState((prev) => ({
        ...prev,
        threads: prev.threads.map((item) =>
          item.id === id ? { ...item, files: [...item.files, ...files] } : item
        ),
      }));
      const input = document.getElementById(`input_${id}`) as HTMLInputElement;
        if (input) {
          input.value = "";
        }
    }
  };

  const removeFileItem = (threadId: number, id: string) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((item) =>
        item.id === threadId
          ? { ...item, files: item.files.filter((f) => f.id !== id) }
          : item
      ),
    }));
  };

  const onAddThread = (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    ev.preventDefault();
    setState((prev) => ({
      ...prev,
      threads: [
        ...prev.threads,
        {
          id: new Date().getTime(),
          content: "",
          files: [],
          type: PostType.CONTENT,
          poll: undefined,
          mentions: [],
          tags: [],
          tagUsers: [],
          isOpenTagUser: false,
        },
      ],
    }));
  };

  const onDeleteThread = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: number
  ) => {
    ev.preventDefault();
    setState((prev) => ({
      ...prev,
      threads: prev.threads.filter((item) => item.id !== id),
    }));
  };

  const onUpdateThreadTagUsers = (id: number, users: TagUser[]) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((item) =>
        item.id === id ? { ...item, tagUsers: users } : item
      ),
    }));
  };

  const taggedUsersMessage = (tagUsers: TagUser[]) => {
    let message = "Tag People";
    if (tagUsers.length === 1) {
      message = `${tagUsers[0].username}`;
    }
    if (tagUsers.length > 1) {
      message = `${tagUsers[0].username} and ${tagUsers.length - 1} more`;
    }
    return shortenText(message, 10);
  };

  const onUpdateFileAltText = (
    threadId: number,
    fileId: string,
    altText: string
  ) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((item) =>
        item.id === threadId
          ? {
              ...item,
              files: item.files.map((f) =>
                f.id === fileId ? { ...f, altText } : f
              ),
            }
          : item
      ),
    }));
  };

  const onUpdateFileFlags = (
    threadId: number,
    fileId: string,
    flags: string[]
  ) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((item) =>
        item.id === threadId
          ? {
              ...item,
              files: item.files.map((f) =>
                f.id === fileId ? { ...f, flags } : f
              ),
            }
          : item
      ),
    }));
  };

  const onUpdatePostFile = (threadId: number, fileId: string, file: File) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((item) =>
        item.id === threadId
          ? {
              ...item,
              files: item.files.map((f) =>
                f.id === fileId ? { ...f, file } : f
              ),
            }
          : item
      ),
    }));
  };

  const onPollOptionCallback = useRef(
    debounce((threadId: number, options: PollOption[]) => {
      setState((prev) => ({
        ...prev,
        threads: prev.threads.map((item) =>
          item.id === threadId
            ? {
                ...item,
                poll: item?.poll
                  ? {
                      ...item?.poll,
                      options,
                    }
                  : item.poll,
              }
            : item
        ),
      }));
    }, 700)
  ).current;

  const onPollCallback = useCallback(
    (threadId: number, poll: Partial<PollThread>) => {
      setState((prev) => ({
        ...prev,
        threads: prev.threads.map((item) =>
          item.id === threadId
            ? {
                ...item,
                poll: item?.poll
                  ? {
                      ...item.poll,
                      ...poll,
                    }
                  : item.poll,
              }
            : item
        ),
      }));
    },
    []
  );

  const onPollDurationCallback = useCallback(
    (threadId: number, duration: PollDuration) => {
      setState((prev) => ({
        ...prev,
        threads: prev.threads.map((item) =>
          item.id === threadId
            ? {
                ...item,
                poll: item?.poll
                  ? {
                      ...item.poll,
                      duration,
                    }
                  : item.poll,
              }
            : item
        ),
      }));
    },
    []
  );

  const onPostScheduleCallback = (scheduleAt?: LocalState["scheduleAt"]) => {
    setState((prev) => ({ ...prev, scheduleAt }));
  };
  const onPostLocationCallback = (location?: LocalState["location"]) => {
    setState((prev) => ({ ...prev, location }));
  };

  const onPostSettingsCallback = (_settings: PostScopeSetting) => {
    setState((prev) => ({ ...prev, ..._settings }));
  };

  const handleSubmit = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    try {
      ev.preventDefault();
      videoUploads.begin();
      setState((prev) => ({ ...prev, loading: true }));
      console.log("Threads ", state.threads);

      const errors = validateThreads(state.threads);

      if (errors.length > 0) {
        return notif.show(errors[0], {
          severity: "error",
          autoHideDuration: 2500,
        });
      }
      if (state.scheduleAt) {
        const scheduleAt = new Date(state.scheduleAt).getTime();
        if (scheduleAt / (1000 * 60) - Date.now() / (1000 * 60) < 5) {
          return notif.show("Schedule your post at least 5 minutes from now.", {
            severity: "error",
            autoHideDuration: 2500,
          });
        }
      }
      const posts = await Promise.all(
        state.threads.map(async (thread) => {
          const media = await Promise.all(
            thread.files.map(async (f) => {
              if (f.file.type.startsWith("image/")) {
                const [uploadedImage] = await uploadMultipleFilesWithMetadata([f]
                );
                return uploadedImage;
              } else if (f.file.type.startsWith("video/")) {
                const [uploadedVideo] = await videoUploads.upload([f]);
                return uploadedVideo;
              } else {
                return null; // Or handle unknown types if needed
              }
            })
          );
          const finalMedia = media.filter((m) => m !== null);
          return {
            content: thread.content,
            media: finalMedia,
            type: thread.type,
            poll: thread.poll,
            quiz: thread.quiz,
            mentions: thread.mentions,
            tags: thread.tags,
            scope: state.scope,
            tagUsers: thread.tagUsers.map((u) => u.id),
          };
        })
      );
      const thread: PostCreate = {
        thread: posts,
        scheduleAt: state.scheduleAt,
        location: state.location,
        isDraft: state.isDraft,
      };
      console.log("create thread post ", post);
      const result = await createPostQuote(post?.id!, thread, token);
      if (!result.data) {
        return notif.show(result.message, {
          severity: "error",
          autoHideDuration: 2500,
        });
      }
      if (!state.scheduleAt && !state.isDraft) onQuoteCallback(post?.id!, true);
      toggleDrawer(ev, false);
      notif.show(result.message, {
        severity: "success",
        autoHideDuration: 2500,
      });
      setState(initialState);
      videoUploads.reset();
    } catch (error) {
      videoUploads.cancel();
      notif.show(getErrorMessage(error), {
        severity: "error",
        autoHideDuration: 2500,
      });
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div>
      <React.Fragment>
        <Dialog
          maxWidth="xl"
          sx={{
            zIndex: 999999,
          }}
          open={open}
          onClose={(ev, reason) => {
            // A click outside the composer must not discard a draft.
            if (state.loading || reason === "backdropClick") return;
            setState(initialState);
            videoUploads.reset();
            toggleDrawer(ev, false);
          }}
          slotProps={{
            paper: {
              sx: {
                top: "0",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                zIndex: 9999,
                width: { lg: 600, md: 600, sm: "100%", width: "100%" },
                maxWidth: "100%",
                px: 0,
              },
            },
            container: {
              sx: {
                minWidth: { lg: 600, md: 600, sm: "100%", width: "100%" },
                maxWidth: "100%",
              },
            },
          }}
        >
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
              disabled={state.loading}
              onClick={(ev) => {
                setState(initialState);
                videoUploads.reset();
                toggleDrawer(ev, false);
              }}
            >
              <Close />
            </IconButton>
            <Tooltip title="Post">
              <Button
                onClick={(ev) => handleSubmit(ev)}
                variant="contained"
                sx={{ borderRadius: 30 }}
                color="primary"
                loading={state.loading}
                disabled={state.loading}
                size="small"
              >
                {state.threads.length > 1 ? "Post All" : "Post"}
              </Button>
            </Tooltip>
          </Stack>

          <VideoUploadProgress {...videoUploads} />
          <DialogContent dividers inert={state.loading} aria-busy={state.loading} sx={{ m: 0, p: 0 }}>
            <Box role="presentation">
              <Container maxWidth="xl" sx={{ mt: 1, pb: 2 }}>
                <Grid size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
                  <Box>
                    {post && (
                      <FeedQuoteItem
                        post={post}
                        onFollowUserCallback={onFollowUserCallback}
                      />
                    )}
                  </Box>
                </Grid>
                {state.threads.map((thread, index) => (
                  <Grid sx={{ mb: 1 }} key={thread.id} container spacing={2}>
                    <Grid size={{ lg: 1, md: 1, sm: 1, xs: 1 }}>
                      <Box
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Avatar
                          sx={{ width: 36, height: 36 }}
                          src={user?.image}
                          alt={user?.name}
                        />
                        <Divider
                          aria-hidden="true"
                          variant="fullWidth"
                          orientation="vertical"
                        />
                      </Box>
                    </Grid>
                    <Grid
                      sx={{ pl: 0 }}
                      size={{ lg: 11, md: 11, sm: 11, xs: 11 }}
                    >
                      <Box suppressHydrationWarning>
                        <ContentEditor
                          onContentChange={(args) => {
                            onThreadContentChange(thread.id, args);
                          }}
                        />
                        <input
                          onChange={(ev) => onFileChange(ev, thread.id)}
                          multiple
                          hidden
                          type="file"
                          ref={fileRef}
                          id={`input_${thread.id}`}
                          accept="image/*,video/*"
                        />
                      </Box>
                      {thread.type === PostType.POLL && (
                        <Box sx={{ mt: 1, position: "relative" }}>
                          <Box sx={{ position: "absolute", right: 12, mt: 1 }}>
                            <IconButton aria-label="Close"
                              size="small"
                              onClick={(ev) => onTogglePoll(ev, thread.id)}
                              sx={[
                                (theme) => ({
                                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                                  padding: 0.5,
                                  color: theme.vars.palette.primary.main,
                                  marginBottom: 0,
                                  ...theme.applyStyles("dark", {
                                    color: theme.vars.palette.grey[500],
                                  }),
                                }),
                              ]}
                            >
                              <Close sx={{ height: 15, width: 15 }} />
                            </IconButton>
                          </Box>
                          <CreatePollCard
                            threadId={thread.id}
                            onPollOptionCallback={onPollOptionCallback}
                            onPollCallback={onPollCallback}
                            onPollDurationCallback={onPollDurationCallback}
                            poll={thread.poll as PollThread}
                          />
                        </Box>
                      )}
                      <Box sx={{ mt: 1 }}>
                        <CarouselContainer
                          item={thread}
                          removeFileItem={removeFileItem}
                          onUpdateFileAltText={onUpdateFileAltText}
                          onUpdateFileFlags={onUpdateFileFlags}
                          onUpdatePostFile={onUpdatePostFile}
                        />
                      </Box>

                      <Box>
                        <Stack
                          sx={{
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                          direction={"row"}
                          spacing={1}
                        >
                          <Stack
                            direction={"row"}
                            sx={{ alignItems: "center" }}
                          >
                            <Tooltip title="Upload media">
                              <IconButton aria-label="Upload media"
                                onClick={(ev) => onSelectFile(ev, thread.id)}
                                disableRipple
                                disabled={thread.type === PostType.POLL}
                                size="small"
                                sx={[
                                  (theme) => ({
                                    // backgroundColor: "rgba(0, 0, 0, 0.1)",
                                    padding: 0.5,
                                    color: theme.vars.palette.grey[500],
                                    marginBottom: 0,
                                    ...theme.applyStyles("dark", {
                                      // backgroundColor: theme.vars.palette.grey[800],
                                      color: theme.vars.palette.grey[500],
                                    }),
                                  }),
                                ]}
                              >
                                {thread.files.length > 0 ? (
                                  <AddPhotoAlternateOutlined
                                    sx={{ height: 15, width: 15 }}
                                  />
                                ) : (
                                  <InsertPhoto sx={{ height: 15, width: 15 }} />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: "PlayFair" }}
                            >
                              Media
                            </Typography>
                          </Stack>

                          <Stack
                            direction={"row"}
                            sx={{ alignItems: "center" }}
                          >
                            <IconButton aria-label="Add poll"
                              disableRipple
                              size="small"
                              disabled={
                                thread.files.length > 0 ||
                                thread.type === PostType.POLL
                              }
                              onClick={(ev) => onTogglePoll(ev, thread.id)}
                              sx={[
                                (theme) => ({
                                  // backgroundColor: "rgba(0, 0, 0, 0.1)",
                                  padding: 0.5,
                                  // color: theme.vars.palette.primary.main,
                                  marginBottom: 0,
                                  ...theme.applyStyles("dark", {
                                    color: theme.vars.palette.grey[500],
                                  }),
                                }),
                              ]}
                            >
                              <PollOutlined sx={{ height: 15, width: 15 }} />
                            </IconButton>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: "PlayFair" }}
                            >
                              Poll
                            </Typography>
                          </Stack>
                          <Stack
                            sx={{ alignItems: "center" }}
                            direction={"row"}
                            onClick={(ev) =>
                              toggleTagPeopleDrawer(thread.id, true)
                            }
                          >
                            <Tooltip title="Tag people">
                              <IconButton aria-label="Tag people"
                                disableRipple
                                size="small"
                                sx={[
                                  (theme) => ({
                                    // backgroundColor: "rgba(0, 0, 0, 0.1)",
                                    padding: 0.5,
                                    color: theme.vars.palette.secondary.main,
                                    marginBottom: 0,
                                    ...theme.applyStyles("dark", {
                                      color: theme.vars.palette.grey[500],
                                    }),
                                  }),
                                ]}
                              >
                                <PersonOutlinedIcon
                                  sx={{ height: 15, width: 15 }}
                                />
                              </IconButton>
                            </Tooltip>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontFamily: "PlayFair",
                                whiteSpace: "nowrap", // Prevents wrapping
                                overflow: "hidden", // Hides overflow text
                                textOverflow: "ellipsis", // Adds "..."
                                maxWidth: "100px", // Set a max width for truncation
                                display: "block", // Required for text-overflow to work
                              }}
                            >
                              {taggedUsersMessage(thread.tagUsers)}
                            </Typography>
                          </Stack>

                          {/* <Stack
                            direction={"row"}
                            sx={{ alignItems: "center" }}
                          >
                            <CircularProgressWithLabel
                              max={state.maxContent}
                              value={thread.content.length}
                            />
                            <Typography
                              variant="caption"
                              sx={{ fontFamily: "PlayFair" }}
                            >
                              Text
                            </Typography>
                          </Stack> */}

                          {state.threads.length > 1 && (
                            <Tooltip title="Add thread">
                              <IconButton aria-label="Remove thread"
                                onClick={(ev) => onDeleteThread(ev, thread.id)}
                                disableRipple
                                size="small"
                                sx={[
                                  (theme) => ({
                                    // backgroundColor: "rgba(0, 0, 0, 0.1)",
                                    padding: 0.5,
                                    // color: theme.vars.palette.secondary.main,
                                    marginBottom: 0,
                                    ...theme.applyStyles("dark", {
                                      color: theme.vars.palette.grey[500],
                                    }),
                                  }),
                                ]}
                              >
                                <DeleteOutlineOutlined
                                  sx={{ height: 15, width: 15 }}
                                />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                        {/* tag people drawer */}
                        <TagPeopleDrawer
                          tagUsers={thread.tagUsers}
                          onUpdateTagUsers={(users) =>
                            onUpdateThreadTagUsers(thread.id, users)
                          }
                          isOpen={thread.isOpenTagUser}
                          toggleDrawer={(ev, open) =>
                            toggleTagPeopleDrawer(thread.id, open)
                          }
                        />
                      </Box>
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
                      sx={{ alignItems: "center" }}
                      onClick={(ev) => togglePostSettingsDrawer(ev, true)}
                    >
                      <IconButton aria-label="Post audience settings"
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
                        <ManageAccountsOutlinedIcon
                          sx={{ height: 15, width: 15 }}
                        />
                      </IconButton>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: "PlayFair" }}
                      >
                        Who can reply?
                      </Typography>
                    </Stack>
                    <Stack sx={{ alignItems: "center" }}>
                      <Tooltip title="Schedule">
                        <IconButton aria-label="Schedule"
                          onClick={(ev) => togglePostScheduleDrawer(ev, true)}
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
                        sx={{ fontFamily: "PlayFair" }}
                      >
                        Schedule
                      </Typography>
                    </Stack>
                    <Stack sx={{ alignItems: "center" }}>
                      <Tooltip title="Add thread">
                        <IconButton aria-label="Set post location"
                          onClick={(ev) => togglePostLocationDrawer(ev, true)}
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
                          <LocationOnOutlinedIcon
                            sx={{ height: 15, width: 15 }}
                          />
                        </IconButton>
                      </Tooltip>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: "PlayFair" }}
                      >
                        Location
                      </Typography>
                    </Stack>
                    <Box>
                      <Tooltip placement="top" title="Add thread">
                        <Stack sx={{ alignItems: "center" }}>
                          <IconButton aria-label="Add thread"
                            onClick={(ev) => onAddThread(ev)}
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
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: "PlayFair" }}
                          >
                            Add
                          </Typography>
                        </Stack>
                      </Tooltip>
                    </Box>
                  </Stack>
                </Box>
              </Container>
            </Box>
          </DialogContent>
        </Dialog>

        {/* post settings drawer */}
        <PostSettingsDrawer
          settings={{scope: state.scope, continents: [], countries: []}}
          onPostSettingsCallback={onPostSettingsCallback}
          isOpen={state.isOpenPostSettings}
          toggleDrawer={togglePostSettingsDrawer}
        />
        {/* post schedule drawer */}
        <PostScheduleDrawer
          scheduleAt={state.scheduleAt}
          isOpen={state.isOpenSchedule}
          toggleDrawer={togglePostScheduleDrawer}
          onPostScheduleCallback={onPostScheduleCallback}
        />
        {/* post location drawer */}
        <PostLocationDrawer
          location={state.location}
          isOpen={state.isOpenLocation}
          toggleDrawer={togglePostLocationDrawer}
          onCallback={onPostLocationCallback}
        />
      </React.Fragment>
    </div>
  );
}
