'use client'
import { useAuthSession } from '@/hooks'
import { getSuggestedConnections, updateUserFollower } from '@/lib/users'
import { ConnTypeEnum } from '@/types'
import { FollowAction, UserConn, UserConnection } from '@/types/user'
import { getFollowStatus } from '@/utils/connections'
import { Avatar, Box, Button, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import React, { useState } from 'react'
import useSWR from 'swr'
import ConnectionCard from './ConnectionCard'

const ConnectionSection = ({ users, connType }: { users: UserConnection[], connType: ConnTypeEnum  }) => {
  
  const { token, user } = useAuthSession();
  const swrKey = `${user.id}_connections_${connType}`;
  const { data, mutate } = useSWR(
    swrKey,
    () => getSuggestedConnections({ limit: 3, type: connType }, token),
    {
      fallbackData: users,
      keepPreviousData: true,
      refreshWhenOffline: false,
      errorRetryCount: 2
    }
  );

  const updateConn = (
      recipientId: string,
      conn: UserConn,
      action: FollowAction
    ) => {
      const updateData = (_data: UserConnection[]) => {
        const actions = [
          FollowAction.UNFOLLOW,
          FollowAction.CANCEL,
          FollowAction.REJECT,
        ];
        if (actions.includes(action)) {
          return _data.filter((d) => d?.id !== recipientId);
        } else {
          return _data.map((d) => {
            if (d?.id === recipientId) {
              const statuses = [FollowAction.ACCEPT, FollowAction.FOLLOW]
              const increment = !d?.meta?.isPrivate && statuses.includes(action)
              const decrement = action === FollowAction.UNFOLLOW
              const followerCount = d.conn.followerCount
              return {
                ...d,
                conn: {
                    ...d.conn,
                    ...conn,
                    followerCount: increment ? followerCount + 1 : decrement ? followerCount - 1 : followerCount,
                }
              };
            }
            return d
          });
        }
      };
      // update reposter
      mutate((_data) => (!_data ? _data : updateData(_data)), {
        optimisticData: (_data) => (!_data ? [] : updateData(_data)),
        revalidate: false,
        populateCache: true,
        rollbackOnError: true,
      });
    };


  const onFollowUser = (connUser: UserConnection, action: FollowAction) => {
    const conn = getFollowStatus(connUser.conn, connUser.meta, action);
    const recipientId = connUser.id
    // mutate for current user
    updateConn(recipientId, conn, action );
    // send to api
    updateUserFollower({ senderId: user.id, recipientId, action }, token);
  };

  if( data.length === 0 ) return null

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
          {data.map((item, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <ConnectionCard item={item} onFollowUser={onFollowUser} />
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