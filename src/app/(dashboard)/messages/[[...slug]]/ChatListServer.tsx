import { auth } from '@/auth'
import { apiUrl } from '@/config';
import React from 'react'
import ChatListClient from './ChatListClient';
import { EncryptedConversation } from '@/types/conversation';

const ChatListServer = async({slug}: { slug: string}) => {
    const session = await auth()
    const user = session?.user
    const result = await fetch(`${apiUrl}/conversations/users/${user?.id}/conversations?kind=${slug}`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": `application/json`,
      Authorization: `Bearer ${user?.accessToken}`,
    },
  });

  const convoList: EncryptedConversation[] = result.ok ? await result.json() : []

  // console.log("convoList ",convoList)

  return (
    <ChatListClient slug={slug} convoList={convoList} initialFetchFailed={!result.ok} />
  )
}

export default ChatListServer
