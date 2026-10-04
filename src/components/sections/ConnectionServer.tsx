import { getServerSession } from "@/lib/server-session";
import { Box, Button, Paper, Typography } from "@mui/material";
import { apiUrl } from '@/config';
import React from 'react'
import ConnectionClient from './ConnectionClient';
import { UserConnection } from '@/types/user';
import { ConnTypeEnum } from '@/types';

const ConnectionServer = async() => {

  const date = new Date();

  const session = await getServerSession();

  if (!session?.user?.accessToken) return <Paper sx={{ p: 3, mt: 2 }}>
    <Typography variant="h6" sx={{ fontWeight: 700 }}>Find your community</Typography>
    <Typography color="text.secondary" sx={{ my: 1 }}>Follow creators, share what matters to you, and discover something new.</Typography>
    <Box sx={{ mt: 2 }}><Button href="/?auth=signup" variant="contained" fullWidth>Join Kwonnet</Button></Box>
  </Paper>;

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
