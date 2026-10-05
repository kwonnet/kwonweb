import {pageMetadata} from '@/lib/seo';
import React from 'react'
import PageClient from './PageClient'

const Page = () => {
  return (
    <PageClient />
  )
}

export default Page
export const metadata = pageMetadata('Settings', 'Manage your Kwonnet account, password, username, notifications and active login sessions.', '/settings', false);
