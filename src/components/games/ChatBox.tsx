"use client";
import React, { useEffect, useRef, useState } from "react";
import { Box, TextField, Button, IconButton, Fade } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChatBubble from "./ChatBubble";
import { useSocketIoContext } from "@/context/SocketIoContext";
import AnswersTable from "./AnswersTable";

type ChatBoxProps = {
  currentUserId: string;
  onSendMessage: (content: string) => void;
  hidden: boolean
};

const ChatBox: React.FC<ChatBoxProps> = ({
  currentUserId,
  onSendMessage,
  hidden
}) => {
  const {  messages, question  } = useSocketIoContext();
  const [newMessage, setNewMessage] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  // Check if user is near the bottom
  const isUserNearBottom = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      return scrollHeight - scrollTop - clientHeight < 500;
    }
    return false;
  };

  useEffect(() => {
    if (isUserNearBottom()) {
      // If user is near the bottom, auto-scroll to the latest message
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollToBottom(false);
  };

  

  return (
    <React.Fragment>
      <Box
        ref={chatContainerRef}
        sx={{
          position: 'relative',
          height: "100%",
          flex: 1,
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
          <IconButton
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
        sx={[(theme) => ({
          display: hidden ? "none" : "flex",
          alignItems: "center",
          width: "100%",
          p: 2,
          borderTop: `1px solid ${theme.vars.palette.grey[100]}`,
          borderBottomRightRadius: 12,
          borderBottomLeftRadius: 12,
          ...theme.applyStyles("dark",{
            borderTop: `1px solid ${theme.vars.palette.grey[800]}`,
          })
        })]}
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
          autoFocus={true}
          sx={{
            borderRadius: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              // bgcolor: "background.paper",
            },
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button
          onClick={() => handleSendMessage()}
          variant="contained"
          color="inherit"
          sx={[theme => ({ ml: 1, background: theme.vars.palette.gradient.D900 })]}
        >
          Send
        </Button>
      </Box>
    </React.Fragment>
  );
};

export default ChatBox;

// import React, { useEffect, useRef, useState } from "react";
// import { Box, Paper, TextField, Button, IconButton, Fade } from "@mui/material";
// import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
// import ChatBubble from "./ChatBubble";

// type ChatMessage = {
//   id: string;
//   createdAt: string;
//   playerName: string;
//   playerId: string;
//   content: string;
// };

// type ChatBoxProps = {
//   messages: ChatMessage[];
//   currentUserId: string;
//   onSendMessage: (content: string) => void;
// };

// const ChatBox: React.FC<ChatBoxProps> = ({
//   messages,
//   currentUserId,
//   onSendMessage,
// }) => {
//   const [newMessage, setNewMessage] = useState("");
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     const handleScroll = () => {
//       const isNearBottom =
//         window.innerHeight + window.scrollY >= document.body.scrollHeight - 200;
//       setShowScrollToBottom(!isNearBottom);
//     };

//     window.addEventListener("scroll", handleScroll);
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

//     return () => window.removeEventListener("scroll", handleScroll);
//   }, [messages]);

//   const handleSendMessage = () => {
//     if (newMessage.trim()) {
//       onSendMessage(newMessage);
//       setNewMessage("");
//     }
//   };

//   const scrollToBottom = () =>
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

//   return (
//     <Box
//       sx={{
//         height: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         bgcolor: "background.paper",
//       }}
//     >
//       {/* Message container */}
//       <Box
//         sx={{
//           display: "flex",
//           flexDirection: "column",
//           width: "100%",
//           maxWidth: "800px",
//           padding: 2,
//           position: "relative",
//           pb: 10,
//           mb: 10,
//         }}
//       >
//         {/* Messages list */}
//         <Box sx={{ flex: 1, padding: 2, bgcolor: "background.default" }}>
//           {messages.map((message) => (
//             <ChatBubble
//               key={message.id}
//               message={message}
//               isSender={message.playerId === currentUserId}
//             />
//           ))}
//           <div ref={messagesEndRef} />
//         </Box>

//         {/* Scroll-to-bottom button */}
//         <Fade in={showScrollToBottom}>
//           <IconButton
//             onClick={scrollToBottom}
//             sx={{
//               position: "fixed",
//               bottom: 80,
//               right: 24,
//               bgcolor: "primary.main",
//               color: "white",
//               "&:hover": { bgcolor: "primary.dark" },
//             }}
//           >
//             <KeyboardArrowDownIcon />
//           </IconButton>
//         </Fade>
//       </Box>

//       {/* Message input box */}
//       <Box
//         sx={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           maxWidth: "800px",
//           bgcolor: "background.paper",
//           position: "sticky",
//           backgroundColor: "background.paper",
//           py: 10,
//         }}
//       >
//         <Box
//           sx={{
//             position: "fixed",
//             bottom: 16,
//             width: "100%",
//             maxWidth: "800px",
//             paddingX: 2,
//             display: "flex",
//             alignItems: "center",
//             borderRadius: 4, // Rounded border
//             zIndex: 9999,
//           }}
//         >
//           <TextField
//             value={newMessage}
//             onChange={(e) => setNewMessage(e.target.value)}
//             placeholder="Type your message"
//             variant="outlined"
//             size="small"
//             fullWidth
//             multiline
//             maxRows={10}
//             sx={{
//               borderRadius: 4, // Rounded input
//               "& .MuiOutlinedInput-root": {
//                 borderRadius: 4, // Ensure TextField input itself is rounded
//                 backgroundColor: "background.paper",
//               },
//             }}
//             onKeyUp={(e) => e.key === "Enter" && handleSendMessage()}
//           />
//           <Button
//             onClick={() => handleSendMessage()}
//             variant="contained"
//             color="primary"
//             sx={{ marginLeft: 1 }}
//           >
//             Send
//           </Button>
//         </Box>
//       </Box>
//     </Box>
//   );
// };

// export default ChatBox;
