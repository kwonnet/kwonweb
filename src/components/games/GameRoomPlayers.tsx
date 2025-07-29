import React from 'react'
import PaperLayout from './PaperLayout'
import PlayersTable from './PlayersTable';
import { GamePlayer } from '@/types';
import { Box } from '@mui/material';

const GameRoomPlayers = ({ currentUserId, players }: {
    currentUserId: string;
    players: GamePlayer[]
  }) => {
  return (
    // <PaperLayout boxHeight={boxHeight}>
        <Box sx={{ p: 2, position: "relative" }}>
        <PlayersTable 
          title='Players in the room' 
          currentUserId={currentUserId} 
          players={players} 
        />
        </Box>
    // </PaperLayout>
  )
}

export default GameRoomPlayers