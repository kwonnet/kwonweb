import { auth } from '@/auth';
import { ErrorMessage } from '@/components/common';
import { apiUrl } from '@/config';
import React from 'react'
import DisplayClient from './DisplayClient';
import { UserConnection } from '@/types/user';
import { ConnTypeEnum } from '@/types';

const MutualFollowsServer = async() => {

  const date = new Date();

  const session = await auth();

  if (!session) return <ErrorMessage message="Error: Can't serve request" />;

  const result = await fetch(`${apiUrl}/users/connections/?type=${ConnTypeEnum.MUTUAL_FOLLOWS}&d=${date.getTime()}&limit=21`, {
    method: "GET",
    next: { revalidate: 60, tags: [`user_${session?.user?.id}_suggestions`] },
    credentials: "include",
    mode: "cors",
    headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
  });

  if (!result.ok && result.status !== 404){
    return <ErrorMessage message="Error: Unable to perform request" />;
  }

  const users: UserConnection[] = result.status === 404 ? [] : await result.json();

  return <DisplayClient
      allowCarousel={true}
      connType={ConnTypeEnum.MUTUAL_FOLLOWS}
      users={users}
    />
  
}

export default MutualFollowsServer