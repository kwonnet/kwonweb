import React from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';

type ChatMessage = {
  id: string;
  createdAt: string;
  playerName: string;
  playerId: string;
  content: string;
};


type ChatBubbleProps = {
    message: ChatMessage;
    isSender: boolean;
  };

  const checkSwenAiMessage = (name: string) => {
     return name?.toLowerCase() === "swen"
  }
  
  const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isSender }) => {
    const isSwen = checkSwenAiMessage(message?.playerName)
    return (
      <Stack
        direction="row"
        justifyContent={isSender ? 'flex-end' : 'flex-start'}
        sx={{ marginBottom: 1 }}
      >
        <Box
          component={Paper}
          elevation={1}
          sx={{
            padding: 1.5,
            maxWidth: '70%',
            backgroundImage: theme => isSwen ? "linear-gradient(135deg, #f0f0f0, #c0c0c0)" : isSender ? theme.vars.palette.gradient.D900: "linear-gradient(135deg, #fafafa, #e0e0e0)",
            color: isSender ? 'white' : 'black',
            borderRadius: isSender ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          }}
        >
          <Typography variant="subtitle2" sx={{color: theme => theme.vars.palette.tints[300]}}>
            {message.playerName} • {new Date(message.createdAt).toLocaleTimeString()}
          </Typography>
          <Typography variant="body1">{message.content}</Typography>
        </Box>
      </Stack>
    );
  };
  

export default ChatBubble;
// new Date().toLocaleTimeString()