import {pageMetadata} from '@/lib/seo';
import React from 'react'

const Page = () => {
  return (
    <div>My Visitors</div>
  )
}

export default Page
export const metadata = pageMetadata('Visitors', 'Visitors on Kwonnet. Connect with your community and manage your experience.', '/visitors', false);
