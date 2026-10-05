import {pageMetadata} from '@/lib/seo';
import React from 'react'

const Page = () => {
  return (
    <div>My bookings</div>
  )
}

export default Page
export const metadata = pageMetadata('Bookings', 'Bookings on Kwonnet. Connect with your community and manage your experience.', '/bookings', false);
