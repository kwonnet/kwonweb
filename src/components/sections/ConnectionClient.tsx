'use client'
import { useAuthSession } from '@/hooks'
import { getSuggestedConnections, updateUserFollower } from '@/lib/users'
import { ConnTypeEnum } from '@/types'
import { UserConnection } from '@/types/user'
import { Avatar, Box, Button, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import React, { useState } from 'react'
import useSWR from 'swr'

const ConnectionSection = ({ users, connType }: { users: UserConnection[], connType: ConnTypeEnum  }) => {
  
  const { token, user } = useAuthSession();
  const swrKey = `${user.id}_connections_${connType}`;
  const { data } = useSWR(
    swrKey,
    () => getSuggestedConnections({ limit: 3, type: connType }, token),
    {
      fallbackData: users,
      keepPreviousData: true,
      refreshWhenOffline: false,
    }
  );

  const onFollowUser = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    userId: string
  ) => {
    ev.preventDefault();
    // send to api
    updateUserFollower({ senderId: user.id, recipientId: userId }, token);
  };

  return (
    <React.Fragment>
        <Box
          sx={[
            (theme) => ({
              border: `1px solid ${theme.vars.palette.divider}`,
              mt: 1,
              borderRadius: 2,
              p: 1,
            }),
          ]}
        >
          <Typography textAlign={"center"} fontWeight={600} variant="h6">
            Who to follow?
          </Typography>
          {data.map((conn, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Stack
                direction={"row"}
                justifyContent={"space-between"}
                alignItems={"center"}
              >
                <Stack direction={"row"} spacing={0.5}>
                  <Avatar src={conn.avatar ?? "/avatar.jpeg"} alt={conn.name} />
                  <Stack direction={"column"}>
                    <Typography variant="subtitle2">{conn.name}</Typography>
                    <Typography
                      color="textDisabled"
                      variant="caption"
                    >@{conn.username}</Typography>
                  </Stack>
                </Stack>
                <Button
                  sx={{ borderRadius: 30 }}
                  variant="outlined"
                  size="small"
                  onClick={ev => onFollowUser(ev, conn.id)}
                  disabled={conn.hasFollowed}
                >
                  {conn.followBack ? "Follow Back" : "Follow"}
                </Button>
              </Stack>
            </Box>
          ))}
          <Box sx={{ textAlign: "center", display: "block", my: 1 }}>
            <Button
              sx={{ borderRadius: 30 }}
              LinkComponent={Link}
              href="/connections"
              variant="outlined"
            >
              See More
            </Button>
          </Box>
        </Box>
    </React.Fragment>
  )
}

export default ConnectionSection