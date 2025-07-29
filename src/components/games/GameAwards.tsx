'use client'
import React from 'react'
import PaperLayout from './PaperLayout'
import { Box, CardMedia, Paper, Stack, Typography } from '@mui/material';
import AwardITem from './AwardITem';
import useSWR from 'swr';
import { getUserAchievements } from '@/lib/users';
import { RewardSkeleton } from '../skeleton';
import { getErrorMessage } from '@/utils';
import { useAuthSession } from '@/hooks';

const GameAwards = ({
  currentUserId,
  catId,
}: {
  currentUserId: string;
  catId: string;
}) => {

  const {user, token} = useAuthSession()

  const year = new Date().getUTCFullYear()

  const {data, error, isLoading} = useSWR({page: 1, limit: 100, catId, year, userId: user.id}, (query) => getUserAchievements(query, token) )


  const dummyData = Array.from({ length: 4 }).map((_, index) => index + 1)

  const isProcessing = !data && isLoading

  const isError = !!(!data && error && !isLoading)

  const achievements = data ? data.data : []

  return (
    <React.Fragment>
        <Box sx={{py: 1, px: 2, height: "100%", overflowY: "auto"}}>
        <Typography variant='h5' sx={{textAlign: "center", fontWeight: 800, fontFamily: "PlayFair"}}>Game Achievements</Typography>
            {isError && <Typography>{getErrorMessage(error)}</Typography> }
            {
              isProcessing ? dummyData.map(i => (<RewardSkeleton key={i} />)) : achievements.map(item => (<AwardITem key={item.id} item={item} />))
            }
        </Box>
    </React.Fragment>
  )
}

export default GameAwards