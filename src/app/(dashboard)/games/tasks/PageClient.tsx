'use client'
import PageHeader from "@/components/common/PageHeader";
import { Box, Container } from '@mui/material'
import React from 'react'
import WatchAds from './WatchAds'
import { useAuthSession } from '@/hooks'
import useSWR from 'swr'
import PageSkeleton from './PageSkeleton'
import { getUserTaskSettings } from '@/lib/swrHooks'

const PageClient = ({ initialSettings, initialUserId }: { initialSettings?: Awaited<ReturnType<typeof getUserTaskSettings>>; initialUserId?: string }) => {
    const { token, user } = useAuthSession();

  const { data, isLoading, error } = useSWR(`/v1/users/${user.id}/task-settings`, (url) => getUserTaskSettings(url, token), { fallbackData: initialUserId === user.id ? initialSettings : undefined, revalidateOnMount: initialUserId !== user.id || initialSettings === undefined });

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