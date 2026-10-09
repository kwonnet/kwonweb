import {pageMetadata} from '@/lib/seo';
import React from 'react'
import ChatBoxServer from './ChatBoxServer'
import StartConvo from './StartConvo'

const Page = async({params}: { params: Promise<{slug: string[]}>}) => {
  const _params = await params
  const recipientId = _params?.slug ? _params.slug[0] : undefined
  const kind = _params?.slug ? _params.slug[1] : undefined
  return (
    <React.Fragment>
      {recipientId && kind && !_params.slug.includes('list') ? <ChatBoxServer recipientId={recipientId} slug={kind} /> :
          <StartConvo />}
    </React.Fragment>
  )
}

export default Page
export async function generateMetadata({params}: {params: Promise<{slug: string[]}>}) {
  const p = await params;
  return pageMetadata('Messages', 'View messages on Kwonnet.', "/" + 'messages' + "/" + (p.slug || []).map(encodeURIComponent).join("/"), false);
}
