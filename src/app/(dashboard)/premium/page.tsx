import {pageMetadata} from '@/lib/seo';
import React from 'react'
import PageClient from './PageClient'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { apiUrl } from '@/config'
import DisplayError from "@/components/common/DisplayError";
import { Typography } from '@mui/material'
import { Subscription } from '@/types'

const Page = async() => {
  const session = await auth()

  if(!session) return redirect("/")

  const result = await fetch(`${apiUrl}/users/${session.user.id}/pro`, {cache: "no-store", headers: {
    Authorization: `Bearer ${session.user.accessToken}`
  }})

  // if(!result.ok){
  //   const message = await result.text()
  //   return <Typography>{message}</Typography>
  // }
  if (!result.ok && result.status !== 404) return <DisplayError status={result.status} message="Unable to load subscription." />;
  const subscription: Subscription | null = result.status === 404 ? null : await result.json()
  return (
    <PageClient subscription={subscription} initialUserId={session.user.id} />
  )
}

export default Page
export const metadata = pageMetadata('Premium', 'Premium on Kwonnet. Connect with your community and manage your experience.', '/premium', false);
