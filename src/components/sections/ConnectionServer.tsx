import { getServerSession } from "@/lib/server-session";
import { Box, Button, Paper, Typography } from "@mui/material";
import { apiUrl } from '@/config';
import React from 'react'
import { getPublicFeed } from "@/lib/public-feed";
import { publicPreviewAuthor } from "@/utils/public-feed";
import ConnectionClient from './ConnectionClient';
import { UserConnection } from '@/types/user';
import { ConnTypeEnum } from '@/types';

const ConnectionServer = async() => {

  const date = new Date();

  const session = await getServerSession();

  if (!session?.user?.accessToken) {
    const { posts } = await getPublicFeed();
    const authors = [...new Map(posts.map(post => [post.userId, publicPreviewAuthor(post)])).values()].slice(0, 3);
    return <ConnectionClient connType={ConnTypeEnum.POPULAR_CREATORS} users={authors} />;
  }

  const result = await fetch(`${apiUrl}/users/connections/?type=${ConnTypeEnum.POPULAR_CREATORS}&d=${date.getTime()}&limit=3`, {
    method: "GET",
    next: { revalidate: 0, tags: [`user_${session?.user?.id}_suggestions`] },
    credentials: "include",
    mode: "cors",
    headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
  });

  // if (!result.ok){
  //   return <ErrorMessage message="Error: Fetching unable to perform request" />;
  // }

  const users: UserConnection[] = !result.ok ? [] : await result.json();

  return <ConnectionClient connType={ConnTypeEnum.POPULAR_CREATORS} users={users} />;
  
}


export default ConnectionServer
