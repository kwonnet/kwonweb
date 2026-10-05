import {pageMetadata} from '@/lib/seo';
import React from 'react'
import PageClient from './PageClient'

const Page = () => {
  return (<PageClient />)
}

export default Page
export const metadata = pageMetadata('Games', 'Games on Kwonnet. Connect with your community and manage your experience.', '/games', false);
