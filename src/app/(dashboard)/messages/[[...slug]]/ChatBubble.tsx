import React from "react";
import { Box, Typography, Paper, Stack, Avatar } from "@mui/material";
import { DecryptedChatMessage } from "@/types/conversation";
import { CheckBoxOutlineBlankTwoTone, CheckOutlined, DoneAllOutlined, FactCheck } from "@mui/icons-material";


type ChatBubbleProps = {
  message: DecryptedChatMessage;
  isSender: boolean;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isSender }) => {
  const isRecipientRead = !!(message.read.find(el => el.userId === message.toUserId))
  const isRecipientSeen = !!(message.seen.find(el => el.userId === message.toUserId))
  const isSeenAndRead = isRecipientRead && isRecipientSeen
  const isSameUser = message?.fromUserId === message?.toUserId

  const ReceiptMessageIcon = () => {
    if(!isSender) return null
    if(isSeenAndRead || isRecipientRead || isSameUser){
      return (<DoneAllOutlined color="info" sx={{height: 16, width: 16}}  />)
    }
    if(isRecipientSeen){
      return (<DoneAllOutlined color="disabled" sx={{height: 16, width: 16}}  />)
    }
    return (<CheckOutlined sx={{height: 16, width: 16}}  />)
    
    
  }
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: isSender ? "flex-end" : "flex-start",
        marginBottom: 1
      }}>
      <Box
        component={Paper}
        elevation={1}
        sx={{
          padding: 1.5,
          maxWidth: "70%",
          backgroundImage: (theme) =>
            isSender
              ? theme.vars.palette.gradient.D900
              : "linear-gradient(135deg, #fafafa, #e0e0e0)",
          color: isSender ? "white" : "black",
          borderRadius: isSender ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        }}
      >
        <Stack direction={"row"} spacing={0.5} sx={{
          alignItems: "center"
        }}>
          <Avatar sx={{height: 25, width: 25}} src={message?.sender?.avatar!} alt={message?.sender?.name}>
            {message?.sender?.name[0]}
          </Avatar>
          <Typography
            variant="subtitle2"
            sx={{ color: (theme) => theme.vars.palette.tints[300] }}
          >
            {message?.sender?.name} •{" "}
            {new Date(message.createdAt).toLocaleTimeString()}
          </Typography>
          <ReceiptMessageIcon />
        </Stack>
        <Typography variant="body1">
          {message?.content} Hello world this is me If you want, I can also modify your server-side socket handlers so that all messages and sessions emitted to the client already have id instead of _id, so the client doesn't need extra mapping. Do you want me to do that next?
        </Typography>
      </Box>
    </Stack>
  );
};

export default ChatBubble;
// new Date().toLocaleTimeString()
