import {pageMetadata} from '@/lib/seo';
import React from 'react'

const Page = () => {
  return (
    <div>Activity page</div>
  )
}

export default Page
export async function generateMetadata({params}: {params: Promise<{username: string}>}) {
  const p = await params;
  return pageMetadata('Account activity', 'View account activity on Kwonnet.', "/" + encodeURIComponent(p.username) + "/" + 'activity', false);
}
