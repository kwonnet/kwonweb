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
  SwipeableDrawer,
  Divider,
  Button,
  Dialog,
  DialogContent,
} from "@mui/material";
import {
  ArrowBack,
  SendOutlined,
  InsertPhoto,
  AddPhotoAlternateOutlined,
  AddOutlined,
  DeleteOutlineOutlined,
  SettingsOutlined,
  Close,
  PollOutlined,
  AccessAlarmOutlined,
} from "@mui/icons-material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
// import { useAuth } from "@/hooks";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { genUniqueRef, getErrorMessage } from "@/utils";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CarouselContainer from "./CarouselContainer";
import TagPeopleDrawer from "./TagPeopleDrawer";
// import { handleImagikPostFileUpload } from "@/lib/imagekit";
import { createPost, createPostQuote, createPostReply } from "@/lib/posts";
// import { toast } from "react-toastify";
import { FeedPost, PostType } from "@/types";
import FeedQuoteItem from "./FeedQuoteItem";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";
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
import ContentEditor from "./ContentEditor";
import PostSettingsDrawer from "./PostSettingsDrawer";
import { handleImagikPostFileUpload } from "@/lib/imagekit";
import { useNotifications } from "@toolpad/core";
import CreatePollCard from "./CreatePollCard";
import { debounce } from "lodash";
import PostScheduleDrawer from "./PostScheduleDrawer";
import PostLocationDrawer from "./PostLocationDrawer";
import { uploadMultipleFilesWithMetadata } from "@/utils/r2-upload";
import { uploadBunnyFilesWithMetadata } from "@/utils/bunny";
import { FollowAction } from "@/types/user";

type LocalState = {
  isOpenTagUser: boolean;
  post: PostThread;
  loading: boolean;
  scope: PostScopeEnum;
  location?: string;
  isOpenPostSettings: boolean;
  isOpenSchedule: boolean;
  scheduleAt?: string | Date;
  isOpenLocation?: boolean;
  isDraft: boolean;
};

const initialState: LocalState = {
  loading: false,
  isOpenTagUser: false,
  isOpenPostSettings: false,
  scope: PostScopeEnum.ANYONE,
  post: {
    id: new Date().getTime(),
    content: "",
    files: [],
    type: PostType.CONTENT,
    tags: [],
    mentions: [],
    tagUsers: [],
    isOpenTagUser: false,
  },
  isOpenSchedule: false,
  isDraft: false,
};

export default function CreateReplyDrawer({
  isOpen,
  toggleDrawer,
  post,
  onReplyCallback,
  onFollowUserCallback,
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  post?: FeedPost;
  onReplyCallback: (id: string, replied: boolean) => void;
  onFollowUserCallback: (
    args: {
      senderId: string;
      recipientId: string;
      action: FollowAction
    }
  ) => void;
}) {
  const open = React.useMemo(() => isOpen, [isOpen]);

  const notif = useNotifications();

  const { data: session } = useSession();

  const user = session?.user as Session["user"];

  const token = session?.user?.accessToken;

  const [state, setState] = useState<LocalState>(initialState);

  const fileRef = useRef<HTMLInputElement>(null);

  const toggleTagPeopleDrawer = (ev: any, isOpenTag: boolean) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, isOpenTagUser: isOpenTag }));
  };

  const onThreadContentChange = (id: number, args: Partial<PostThread>) => {
    setState((prev) => ({
      ...prev,
      post: { ...prev.post, ...args },
    }));
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
        post: { ...prev.post, files: [...prev.post.files, ...files] },
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
      post: { ...prev.post, files: prev.post.files.filter((f) => f.id !== id) },
    }));
  };

  const onUpdateTagUsers = (users: TagUser[]) => {
    setState((prev) => ({
      ...prev,
      post: {
        ...prev.post,
        tagUsers: users,
      },
    }));
  };

  const taggedUsersMessage = () => {
    if (state.post.tagUsers.length === 0) return "Tag People";
    if (state.post.tagUsers.length === 1)
      return `${state.post.tagUsers[0].username}`;
    return `${state.post.tagUsers[0].username} & ${
      state.post.tagUsers.length - 1
    } others`;
  };

  const onUpdateFileAltText = (
    _threadId: number,
    fileId: string,
    altText: string
  ) => {
    setState((prev) => ({
      ...prev,
      post: {
        ...prev.post,
        files: prev.post.files.map((f) =>
          f.id === fileId ? { ...f, altText } : f
        ),
      },
    }));
  };

  const onUpdateFileFlags = (
    _threadId: number,
    fileId: string,
    flags: string[]
  ) => {
    setState((prev) => ({
      ...prev,
      post: {
        ...prev.post,
        files: prev.post.files.map((f) =>
          f.id === fileId ? { ...f, flags } : f
        ),
      },
    }));
  };

  const onUpdatePostFile = (_threadId: number, fileId: string, file: File) => {
    setState((prev) => ({
      ...prev,
      post: {
        ...prev.post,
        files: prev.post.files.map((f) =>
          f.id === fileId ? { ...f, file } : f
        ),
      },
    }));
  };

  const togglePostSettingsDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, isOpenPostSettings: open }));
  };

  const onPostSettingsCallback = (settings: PostScopeSetting) => {
    setState((prev) => ({ ...prev, ...settings }));
  };

  const togglePostScheduleDrawer = (ev: any, open: boolean) => {
    ev?.preventDefault();
    setState((prev) => ({ ...prev, isOpenSchedule: open }));
  };
  const togglePostLocationDrawer = (ev: any, open: boolean) => {
    ev?.preventDefault();
    setState((prev) => ({ ...prev, isOpenLocation: open }));
  };

  const onPostScheduleCallback = (scheduleAt?: LocalState["scheduleAt"]) => {
    setState((prev) => ({ ...prev, scheduleAt }));
  };
  const onPostLocationCallback = (location?: LocalState["location"]) => {
    setState((prev) => ({ ...prev, location }));
  };

  const onTogglePoll = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
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
        post: {
          ...prev.post,
          ...(prev.post.type === PostType.POLL
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
        },
      };
    });
  };

  const onPollOptionCallback = useRef(
    debounce((_threadId: number, options: PollOption[]) => {
      setState((prev) => ({
        ...prev,
        post: {
          ...prev.post,
          poll: prev.post?.poll
            ? {
                ...prev.post.poll,
                options,
              }
            : prev.post.poll,
        },
      }));
    }, 700)
  ).current;

  const onPollCallback = useCallback(
    (_threadId: number, poll: Partial<PollThread>) => {
      setState((prev) => ({
        ...prev,
        post: {
          ...prev.post,
          poll: prev.post?.poll
            ? {
                ...prev.post.poll,
                ...poll,
              }
            : prev.post.poll,
        },
      }));
    },
    []
  );

  const onPollDurationCallback = useCallback(
    (_threadId: number, duration: PollDuration) => {
      setState((prev) => ({
        ...prev,
        post: {
          ...prev.post,
          poll: prev.post?.poll
            ? {
                ...prev.post.poll,
                duration,
              }
            : prev.post.poll,
        },
      }));
    },
    []
  );

  const handleSubmit = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    try {
      ev.preventDefault();
      if (!post) {
        return notif.show("No quoted post", { severity: 'warning', autoHideDuration: 3000})
      }
      setState((prev) => ({ ...prev, loading: true }));
      const uploadedFiles =
        state.post.files.length > 0
          ? await Promise.all(
              state.post.files.map(async (f) => {
                if (f.file.type.startsWith("image/")) {
                  const [uploadedImage] = await uploadMultipleFilesWithMetadata([f]
                  );
                  return uploadedImage;
                } else if (f.file.type.startsWith("video/")) {
                  const [uploadedVideo] = await uploadBunnyFilesWithMetadata([
                    f,
                  ]);
                  return uploadedVideo;
                } else {
                  return null; // Or handle unknown types if needed
                }
              })
            )
          : [];
      const media = uploadedFiles.filter((m) => m !== null);
      
      const thread = {
        content: state.post.content,
        media,
        poll: state.post.poll,
        type: state.post.type,
        mentions: state.post.mentions,
        tags: state.post.tags,
        scope: state.scope,
        tagUsers: state.post.tagUsers.map((u) => u.id),
      };
      const postObj: PostCreate = {
        thread: [thread],
        isDraft: state.isDraft,
        location: state.location,
        scheduleAt: state.scheduleAt,
      };
      const result = await createPostReply(post?.id!, postObj, token);
      notif.show(result.message, {
        autoHideDuration: 2500,
        severity: result.data ? "success" : "error",
      });
      if (result.data) {
        setState(initialState);
        onReplyCallback(post?.id!, true);
        toggleDrawer(ev, false);
      }
    } catch (error) {
      notif.show(getErrorMessage(error), {
        autoHideDuration: 2500,
        severity: "error",
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
            zIndex: 999999999999,
          }}
          open={open}
          onClose={(ev) => {
            setState(initialState);
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
            <IconButton
              color="inherit"
              onClick={(ev) => {
                setState(initialState);
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
                Post
              </Button>
            </Tooltip>
          </Stack>
          <DialogContent dividers sx={{ m: 0, p: 0 }}>
            <Box sx={{ width: "auto" }} role="presentation">
              <Container maxWidth="xl" sx={{ pb: 2 }}>
                <Grid sx={{ mb: 1 }} container spacing={2}>
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
                  <Grid size={{ lg: 1, md: 1, sm: 1, xs: 1 }}>
                    <Box sx={{ height: "100%" }}>
                      <Avatar
                        sx={{ width: 36, height: 36 }}
                        src={user.image}
                        alt={user.name}
                      />
                    </Box>
                  </Grid>
                  <Grid
                    sx={{ pl: 1 }}
                    size={{ lg: 11, md: 11, sm: 11, xs: 11 }}
                  >
                    <Box component={"form"}>
                      <Box suppressHydrationWarning>
                        <ContentEditor
                          placeholder="Reply to post"
                          onContentChange={(args) => {
                            onThreadContentChange(state.post.id, args);
                          }}
                        />
                        <input
                          onChange={(ev) => onFileChange(ev, state.post.id)}
                          multiple
                          hidden
                          type="file"
                          ref={fileRef}
                          id={`input_${state.post.id}`}
                          accept="image/*,video/*"
                        />
                      </Box>

                      <input
                        onChange={(ev) => onFileChange(ev, state.post.id)}
                        multiple
                        hidden
                        type="file"
                        ref={fileRef}
                        id={`input_${state.post.id}`}
                        accept="image/*"
                      />
                    </Box>
                    {state.post.type === PostType.POLL && (
                      <Box sx={{ mt: 1, position: "relative" }}>
                        <Box sx={{ position: "absolute", right: 12, mt: 1 }}>
                          <IconButton
                            size="small"
                            onClick={(ev) => onTogglePoll(ev)}
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
                          threadId={state.post.id}
                          onPollOptionCallback={onPollOptionCallback}
                          onPollCallback={onPollCallback}
                          onPollDurationCallback={onPollDurationCallback}
                          poll={state?.post?.poll as PollThread}
                        />
                      </Box>
                    )}
                    <Box sx={{ mt: 1 }}>
                      <CarouselContainer
                        item={state.post}
                        removeFileItem={removeFileItem}
                        onUpdateFileAltText={onUpdateFileAltText}
                        onUpdateFileFlags={onUpdateFileFlags}
                        onUpdatePostFile={onUpdatePostFile}
                      />
                    </Box>
                    <Box sx={{ m: 0, p: 0, my: 1 }}>
                      <Stack
                        direction={"row"}
                        spacing={1}
                        sx={{
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Stack direction={"row"} sx={{ alignItems: "center" }}>
                          <Tooltip title="Upload media">
                            <IconButton
                              onClick={(ev) => onSelectFile(ev, state.post.id)}
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
                              {state.post.files.length > 0 ? (
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
                            sx={{ fontFamily: "PlayFair" }}
                          >
                            Media
                          </Typography>
                        </Stack>
                        <Stack direction={"row"} sx={{ alignItems: "center" }}>
                          <IconButton
                            disableRipple
                            size="small"
                            disabled={
                              state.post.files.length > 0 ||
                              state.post.type === PostType.POLL
                            }
                            onClick={(ev) => onTogglePoll(ev)}
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
                            color="textDisabled"
                            sx={{ fontFamily: "PlayFair" }}
                          >
                            Poll
                          </Typography>
                        </Stack>
                        <Stack
                          direction={"row"}
                          sx={{ alignItems: "center" }}
                          onClick={(ev) => toggleTagPeopleDrawer(ev, true)}
                        >
                          <Tooltip title="Tag people">
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
                              <PersonOutlinedIcon
                                sx={{ height: 15, width: 15 }}
                              />
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
                            {taggedUsersMessage()}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </Grid>
                  <Grid size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
                    <Stack
                      direction={"row"}
                      spacing={1}
                      sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Stack direction={"row"} sx={{ alignItems: "center" }}>
                        <IconButton
                          disableRipple
                          onClick={(ev) => togglePostSettingsDrawer(ev, true)}
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
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: "PlayFair" }}
                        >
                          Who can reply?
                        </Typography>
                      </Stack>
                      <Stack direction={"row"} sx={{ alignItems: "center" }}>
                        <Tooltip title="Schedule">
                          <IconButton
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
                            <AccessAlarmOutlined
                              sx={{ height: 15, width: 15 }}
                            />
                          </IconButton>
                        </Tooltip>
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: "PlayFair" }}
                        >
                          Schedule
                        </Typography>
                      </Stack>
                      <Stack direction={"row"} sx={{ alignItems: "center" }}>
                        <Tooltip title="Location">
                          <IconButton
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
                    </Stack>
                  </Grid>
                </Grid>
              </Container>
            </Box>
          </DialogContent>
        </Dialog>
        {/* tag people drawer */}
        <TagPeopleDrawer
          tagUsers={state.post.tagUsers}
          onUpdateTagUsers={onUpdateTagUsers}
          isOpen={state.isOpenTagUser}
          toggleDrawer={toggleTagPeopleDrawer}
        />
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
