import {pageMetadata} from '@/lib/seo';
import React from 'react'
import PageClient from './PageClient'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { apiUrl } from '@/config'
import { Typography } from '@mui/material'
import { Subscription } from '@/types'

const Page = async() => {
  const session = await auth()

  if(!session) return redirect("/")

  const result = await fetch(`${apiUrl}/users/${session.user.id}/pro`, {next: { revalidate: 30, tags: [`${session.user.id}_pro`]}, headers: {
    Authorization: `Bearer ${session.user.accessToken}`
  }})

  // if(!result.ok){
  //   const message = await result.text()
  //   return <Typography>{message}</Typography>
  // }
  const subscription: Subscription = !result.ok ? undefined : await result.json()
  return (
    <PageClient subscription={subscription} />
  )
}

export default Page
export const metadata = pageMetadata('Premium', 'Premium on Kwonnet. Connect with your community and manage your experience.', '/premium', false);
