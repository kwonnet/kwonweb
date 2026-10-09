"use client";
import { handleGameInputEnter, stopGameInputEnterKeyUp } from "@/utils/game-input";
import React, { useEffect, useRef, useState } from "react";
import { Box, TextField, Button, IconButton, Fade } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChatBubble from "./ChatBubble";
import AnswersTable from "./AnswersTable";
import { useGameSocketIoContext } from "@/context/GameSocketIoContext";

type ChatBoxProps = {
  currentUserId: string;
  onSendMessage: (content: string) => void;
  hidden: boolean;
};

const ChatBox: React.FC<ChatBoxProps> = ({
  currentUserId,
  onSendMessage,
  hidden,
}) => {
  const { messages, question } = useGameSocketIoContext();
  const [newMessage, setNewMessage] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  // Check if user is near the bottom
  const isUserNearBottom = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      return scrollHeight - scrollTop - clientHeight < 500;
    }
    return false;
  };

  useEffect(() => {
    if (isUserNearBottom()) {
      // If user is near the bottom, auto-scroll to the latest message
      const pane = chatContainerRef.current;
      pane?.scrollTo({ top: pane.scrollHeight, behavior: "smooth" });
      setShowScrollToBottom(false);
    } else {
      // Show the "scroll to bottom" button if the user is not near the bottom
      setShowScrollToBottom(true);
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
      return true;
    }
  };

  const scrollToBottom = () => {
    const pane = chatContainerRef.current;
    pane?.scrollTo({ top: pane.scrollHeight, behavior: "smooth" });
    setShowScrollToBottom(false);
  };

  return (
    <React.Fragment>
      <Box
        ref={chatContainerRef}
        sx={{
          position: "relative",
          minHeight: 0,
          flex: 1,
          overscrollBehavior: "contain",
          overflowY: "auto",
          px: 2,
          pt: 2,
          borderRadius: 2,
          // bgcolor: "background.paper",
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
        onScroll={() => setShowScrollToBottom(!isUserNearBottom())}
      >
        <AnswersTable currentUserId={currentUserId} />
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            isSender={message.playerId === currentUserId}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={{ position: "relative" }}>
        <Fade in={showScrollToBottom}>
          <IconButton aria-label="Scroll to latest message"
            onClick={scrollToBottom}
            sx={{
              position: "absolute",
              bottom: 20,
              right: 15,
              bgcolor: "primary.light",
              color: "white",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </Fade>
      </Box>
      <Box
        sx={[
          (theme) => ({
            display: hidden ? "none" : "flex",
            alignItems: "center",
            flexShrink: 0,
            pb: "max(16px, env(safe-area-inset-bottom))",
            width: "100%",
            p: 2,
            borderTop: `1px solid ${theme.vars.palette.grey[100]}`,
            borderBottomRightRadius: 12,
            borderBottomLeftRadius: 12,
            ...theme.applyStyles("dark", {
              borderTop: `1px solid ${theme.vars.palette.grey[800]}`,
            }),
          }),
        ]}
      >
        <TextField
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message"
          variant="outlined"
          size="small"
          fullWidth
          multiline
          maxRows={4}
          sx={{
            borderRadius: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              // bgcolor: "background.paper",
            },
          }}
          onKeyDown={event => handleGameInputEnter(event, handleSendMessage)}
          onKeyUp={stopGameInputEnterKeyUp}
        />
        <Button
          type="button"
          onClick={() => handleSendMessage()}
          variant="contained"
          color="inherit"
          sx={[
            (theme) => ({
              ml: 1,
              background: theme.vars.palette.gradient.D900,
            }),
          ]}
        >
          Send
        </Button>
      </Box>
    </React.Fragment>
  );
};

export default ChatBox;
