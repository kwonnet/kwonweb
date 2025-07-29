'use client'
import { PageHeader } from '@/components/common'
import { Box, Container } from '@mui/material'
import React from 'react'
import WatchAds from './WatchAds'
import { useAuthSession } from '@/hooks'
import useSWR from 'swr'
import PageSkeleton from './PageSkeleton'
import { getUserTaskSettings } from '@/lib/swrHooks'

const PageClient = () => {
    const { token, user } = useAuthSession();

  const { data, isLoading, error } = useSWR(`/v1/users/${user.id}/task-settings`, (url) => getUserTaskSettings(url, token));

  if (!data && isLoading) return <PageSkeleton />;
  return (
    <Box>
      <Container maxWidth="xl">
        <PageHeader title="Tasks" />
        <WatchAds />
        </Container>
        </Box>
  )
}

export default PageClient