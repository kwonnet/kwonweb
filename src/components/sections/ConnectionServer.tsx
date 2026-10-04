import { getServerSession } from "@/lib/server-session";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiUrl } from '@/config';
import React from 'react'
import ConnectionClient from './ConnectionClient';
import { UserConnection } from '@/types/user';
import { ConnTypeEnum } from '@/types';

const ConnectionServer = async() => {

  const date = new Date();

  const session = await getServerSession();

  if (!session) return <ErrorMessage message="Error: Can't serve request" />;

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
