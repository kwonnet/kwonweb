"use client";
import {
  Avatar,
  Box,
  Button,
  Fade,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import PhoneEnabledOutlinedIcon from "@mui/icons-material/PhoneEnabledOutlined";
import StickyBox from "react-sticky-box";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import AttachmentOutlinedIcon from "@mui/icons-material/AttachmentOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { delayExecution, getCurrentSegment, getErrorMessage } from "@/utils";
import ChatBubble from "./ChatBubble";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useAuthSession } from "@/hooks";
import Link from "next/link";
import { UserPublic } from "@/types/user";
import {
  createConversation,
  getUserChatDevices,
  updateUserConversations,
} from "@/lib/conversations";
import { useNotifications } from "@toolpad/core";
import { useConvoSocketIoContext } from "@/context/ConvoSocketIoContext";
import { bootstrapPerDeviceSessions, encryptForAllDevices } from "@/lib/sodium";
import { ChatDevice } from "@/types/sodium";
import useSWR from "swr";
import {
  Conversation,
  ConvoKind,
  EncryptedChatMessage,
} from "@/types/conversation";
import { useUserStats } from "@/lib/swrHooks";
import { ArrowBackIosNewOutlined } from "@mui/icons-material";
import { usePathname } from "next/navigation";

const ChatBoxClient = ({
  params,
}: {
  params: {
    recipient: UserPublic;
    convo?: Conversation;
    recipientDevices: ChatDevice[];
    messages: EncryptedChatMessage[];
  };
}) => {
  const { user, token } = useAuthSession();

  const localDeviceId = `d_${user.id?.slice(-10)}`;

  const { recipient } = params;

  const { mutate: mutateStats } = useUserStats({ userId: user.id, token });

  const notif = useNotifications();

  const pathname = usePathname();

  const segment = getCurrentSegment(pathname);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const initialScrollRef = useRef(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const {
    convoSocketIo: socketIo,
    messages,
    updateMesssages,
  } = useConvoSocketIoContext();

  const [state, setState] = useState<{
    message: string;
    convo?: Conversation;
  }>({ message: "", convo: params.convo });

  // get recipient devices
  const { data: recipientDevices } = useSWR(
    { id: recipient.id, kind: "devices" },
    (args) => getUserChatDevices(args.id, token),
    { fallbackData: params.recipientDevices }
  );

  const updateReadSeenStatus = useCallback(async () => {
    // update unseen and unread messages
    if (state.convo) {
      if (state.convo?.unreadCount > 0 || state.convo.unseenCount > 0) {
        await updateUserConversations(
          {
            convoId: state.convo.id,
            userId: user.id,
            isRead: state.convo.unreadCount > 0,
            isSeen: state.convo.unseenCount > 0,
          },
          token
        );
        mutateStats(undefined, { revalidate: true, populateCache: true });
      }
    }
  }, [state.convo, user.id, token, mutateStats]);

  useEffect(() => {
    updateMesssages(params.messages);
  }, [params.messages, updateMesssages]);

  const convoId = state.convo?.id;

  useEffect(() => {
    // join convo room
    if (convoId) {
      socketIo?.emit("convo:join", { convoId });
      // Join device-specific room so the server can target this device
      socketIo?.emit("room:join", {
        room: `user:${user.id}:device:${localDeviceId}`,
      });
    }

    return () => {
      socketIo?.emit("convo:leave", { convoId });
    };
  }, [socketIo, convoId, user.id, localDeviceId]);

  useEffect(() => {
    if (state.convo?.responder.acceptedAt) {
      updateReadSeenStatus();
    }
  }, [state.convo?.id, state.convo?.unreadCount, state.convo?.unseenCount, state.convo?.responder.acceptedAt, updateReadSeenStatus]);

  useLayoutEffect(() => {
    const timeout = setTimeout(() => {
      if (initialScrollRef.current && chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
        initialScrollRef.current = !socketIo?.connected;
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, [messages, socketIo?.connected]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const container = chatContainerRef.current;
      const nearBottom = container
        ? container.scrollHeight - container.scrollTop - container.clientHeight < 500
        : false;
      if (nearBottom) {
        // If user is near the bottom, auto-scroll to the latest message
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowScrollToBottom(false);
      } else {
        // Show the "scroll to bottom" button if the user is not near the bottom
        setShowScrollToBottom(true);
      }
      updateReadSeenStatus();
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages, updateReadSeenStatus]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollToBottom(false);
  };

  const handleTextChange = (
    ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setState((prev) => ({ ...prev, message: ev.target.value }));
  };

  const sendMessage = async () => {
    try {
      console.log("conversation state ", state.convo);
      const bundles = recipientDevices ?? [];
      if (!state.message) {
        return notif.show("Please type message", {
          severity: "error",
          autoHideDuration: 5000,
        });
      }
      if (!recipient) {
        notif.show(
          "No recipient found, you can't send message to this user this time around",
          { severity: "error", autoHideDuration: 5000 }
        );
      }
      if (recipientDevices.length === 0) {
        notif.show(
          "Recipient device not setup, you can't send message to this user this time around",
          { severity: "error", autoHideDuration: 5000 }
        );
      }
      if (!state.convo) {
        //1. initiate conversation
        const convoRes = await createConversation(
          {
            senderId: user.id,
            recipientId: recipient?.id,
            kind: segment as ConvoKind,
          },
          token
        );
        console.log("conversation response ", convoRes);
        // emit join
        socketIo?.emit("convo:join", { convoId: convoRes.id });
        // Join device-specific room so the server can target this device
        socketIo?.emit("room:join", {
          room: `user:${user.id}:device:${localDeviceId}`,
        });
        //2. bootstrap per-device sessions (X3DH → DR)
        await bootstrapPerDeviceSessions(
          user.id,
          localDeviceId,
          recipient.id,
          bundles,
          socketIo!
        );
        console.log("bootstrap session done ....");
        //3. send message to connected devices
        const envelopes = await encryptForAllDevices(
          user.id,
          localDeviceId,
          recipient?.id,
          bundles,
          state.message
        );
        console.log("Message encrypted envelops - ", envelopes);
        // then send the message
        socketIo?.emit("message:send", {
          convoId: convoRes.id,
          envelopes,
        });
        setState((prev) => ({ ...prev, message: "", convo: convoRes }));
      } else {
        await bootstrapPerDeviceSessions(
          user.id,
          localDeviceId,
          recipient.id,
          bundles,
          socketIo!
        );
        const envelopes = await encryptForAllDevices(
          user.id,
          localDeviceId,
          recipient?.id,
          recipientDevices,
          state.message
        );
        // then send the message
        socketIo?.emit("message:send", {
          convoId: state?.convo?.id,
          envelopes,
        });
      }
      setState((prev) => ({
        ...prev,
        message: "",
      }));
    } catch (error) {
      notif.show(getErrorMessage(error), {
        severity: "error",
        autoHideDuration: 4000,
      });
    }
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === "Enter" && state.message) {
      ev.preventDefault();
      ev.stopPropagation();
      sendMessage();
    }
  };

  const handleSubmit = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.preventDefault();
    sendMessage();
  };

  const isNotEmpty = !!state.message;

  const badgeColor = "info.light";

  const responder = state?.convo?.responder;

  const initiator = state?.convo?.initiator;

  const responderNotAccepted = !!(responder && user.id === responder?.id && !responder.acceptedAt)

  const noRecipientDevice = recipientDevices.length === 0 

  function isUserNearBottom() {
    throw new Error("Function not implemented.");
  }

 

  return (
    <React.Fragment>
      <Fade in={true} timeout={3000}>
        <Box
          sx={{
            height: "calc(100vh - 60px)",
            overflow: "hidden",
            maxHeight: "100%",
            p: 0,
            // px: {lg: 1, md: 1, sm: 0, xs: 0},
            position: "relative",
          }}
        >
          <StickyBox style={{ zIndex: 9999 }}>
            <Paper elevation={0} sx={{ p: 1 }}>
              <Stack
                direction={"row"}
                justifyContent={"space-between"}
                alignItems={"center"}
                sx={{ pt: 0.5 }}
              >
                <Stack
                  direction={"row"}
                  alignItems={"center"}
                  spacing={0.5}
                  sx={{ cursor: "pointer" }}
                >
                  <Stack direction={"row"} alignItems={"center"} spacing={0.1}>
                    <Box
                    // sx={{
                    //   display: {
                    //     lg: "none",
                    //     md: "none",
                    //     sm: "block",
                    //     xs: "block",
                    //   },
                    // }}
                    >
                      <IconButton LinkComponent={Link} href="/messages">
                        <ArrowBackIosNewOutlined />
                      </IconButton>
                    </Box>
                    <Box>
                      <Avatar
                        component={Link}
                        href={`/@${recipient.username}`}
                        src={recipient?.avatar!}
                        alt={recipient?.name}
                        sx={{
                          width: { lg: 50, md: 50, sm: 30, xs: 30 },
                          height: { lg: 50, md: 50, sm: 30, xs: 30 },
                          borderRadius: "50%",
                          textDecoration: "none",
                        }}
                      >
                        {recipient?.name[0]}
                      </Avatar>
                    </Box>
                  </Stack>
                  <div>
                    <Stack
                      direction="column"
                      spacing={-1}
                      component={Link}
                      href={`/@${recipient.username}`}
                      sx={{ textDecoration: "none" }}
                    >
                      <Stack
                        direction={"row"}
                        alignItems={"center"}
                        spacing={0.3}
                      >
                        <Typography
                          color="textSecondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 1, // Number of lines before truncating
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            maxWidth: "100%",
                            fontWeight: 800,
                          }}
                          // variant={{lg: "h6"}}
                        >
                          {recipient.name}
                        </Typography>
                        {recipient?.meta?.isPro && (
                          <IconButton size="small" sx={{ flexShrink: 0 }}>
                            <VerifiedIcon
                              sx={{ width: 14, height: 14, color: badgeColor }}
                            />
                          </IconButton>
                        )}
                      </Stack>
                      <Typography
                        variant="caption"
                        color="textDisabled"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 1, // Number of lines before truncating
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          maxWidth: "100%",
                        }}
                      >
                        @{recipient.username}
                      </Typography>
                    </Stack>
                  </div>
                </Stack>
                <Stack direction={"row"} spacing={0.5}>
                  <Box>
                    <IconButton size="small">
                      <VideocamOutlinedIcon />
                    </IconButton>
                  </Box>
                  <Box>
                    <IconButton size="small">
                      <PhoneEnabledOutlinedIcon />
                    </IconButton>
                  </Box>
                </Stack>
              </Stack>
            </Paper>
          </StickyBox>

          {/* chat section */}
          <Box
            ref={chatContainerRef}
            sx={{
              px: 0.5,
              height: responderNotAccepted ? "calc(100vh - 300px)" : "calc(100vh - 170px)",
              marginTop: responderNotAccepted ? 12.5 : 0,
              overflow: "auto", // bgcolor: "background.paper",
              boxShadow: "inset 0px 0px 5px rgba(0,0,0,0.1)",
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.3)",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "transparent",
              },
              scrollbarWidth: "thin", // Firefox
              scrollbarColor: "rgba(0, 0, 0, 0.2) transparent",
            }}
            // onScroll={() => setShowScrollToBottom(!isUserNearBottom())}
            
          >
            {messages.map((chat, index) => (
              <ChatBubble
                key={index}
                isSender={chat.fromUserId === user.id}
                message={chat}
              />
            ))}
            <div ref={messagesEndRef} />
          </Box>
          <Box sx={{ position: "relative" }}>
            <Fade in={showScrollToBottom}>
              <IconButton
                onClick={scrollToBottom}
                sx={{
                  position: "absolute",
                  bottom: 20,
                  right: 15,
                  bgcolor: "primary.dark",
                  // color: "text.primary",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                <KeyboardArrowDownIcon />
              </IconButton>
            </Fade>
          </Box>

          <Box sx={{ position: "absolute", width: "100%", bottom: responderNotAccepted ? -100 : 0, px: 1 }}>
            {/* initiator && responder && !responder.acceptedAt ? (
              <Typography textAlign={"center"} sx={{ py: 1 }}>
                {recipient?.name} has to accept your conversation first
                before you can chat with them.
              </Typography>
            ) : */}
            {responderNotAccepted &&  <Paper
                elevation={0}
                sx={{
                  p: 0.5,
                  py: 1,
                  width: "100%",
                  justifyContent: "center",
                  display: "flex",
                  flexDirection: "column",
                  // alignItems: "center"
                }}
              >
                <Typography textAlign={"center"} sx={{ py: 1 }}>
                  This user is texting you for the first time, you can choose to
                  accept or reject and they won't know if you've read the chat.
                </Typography>
                <Grid
                  container
                  spacing={1}
                  sx={{ width: "100%", justifyContent: "center" }}
                >
                  <Grid size={{ lg: 3, md: 3, sm: 3, xs: 3 }}>
                    <Button
                      size="small"
                      sx={{ borderRadius: 30 }}
                      variant="outlined"
                      color="info"
                    >
                      Accept
                    </Button>
                  </Grid>
                  <Grid size={{ lg: 3, md: 3, sm: 3, xs: 3 }}>
                    <Button
                      size="small"
                      sx={{ borderRadius: 30 }}
                      variant="outlined"
                      color="warning"
                    >
                      Reject
                    </Button>
                  </Grid>
                  <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
                    <Button
                      size="small"
                      sx={{ borderRadius: 30 }}
                      variant="outlined"
                      color="error"
                    >
                      Block & Report
                    </Button>
                  </Grid>
                </Grid>
              </Paper>}

              {noRecipientDevice && (
              <Typography textAlign={"center"} color="warning" sx={{ p: 1 }}>
                Sorry, you can't send message to this user right now until they
                setup their device.
              </Typography>)}
            {noRecipientDevice ? null : (
              <Stack
                direction={"row"}
                sx={{ width: "100%" }}
                justifyContent={"space-between"}
              >
                <Stack
                  direction={"row"}
                  sx={{ width: "100%" }}
                  alignItems={"center"}
                >
                  <Box>
                    <IconButton>
                      <EmojiEmotionsOutlinedIcon />
                    </IconButton>
                  </Box>
                  <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Type message"
                    fullWidth={true}
                    multiline={true}
                    maxRows={2}
                    onChange={(ev) => handleTextChange(ev)}
                    onKeyDown={(ev) => onKeyDown(ev)}
                    value={state.message}
                    sx={{ borderRadius: 30 }}
                    slotProps={{
                      input: {
                        sx: {
                          borderRadius: 10,
                        },
                      },
                    }}
                  />
                </Stack>
                <Stack direction={"row"} spacing={1} alignItems={"center"}>
                  <Box>
                    <IconButton>
                      <AttachmentOutlinedIcon />
                    </IconButton>
                  </Box>
                  <Box>
                    <IconButton onClick={(ev) => handleSubmit(ev)}>
                      {isNotEmpty ? <SendOutlinedIcon /> : <MicOutlinedIcon />}
                    </IconButton>
                  </Box>
                </Stack>
              </Stack>
            )}
          </Box>
        </Box>
      </Fade>
    </React.Fragment>
  );
};

export default ChatBoxClient;
