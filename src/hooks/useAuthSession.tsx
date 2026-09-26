'use client'
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const useAuthSession = () => {
  
  const { data: session } = useSession();

  const router = useRouter()

  const user = session?.user as Session['user']

  const token = session?.user?.accessToken

  // if(!user) {
  //   router.push('/auth/signin')
  // }

  return { user, token}
}

export default useAuthSession
