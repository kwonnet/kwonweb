'use client'
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';


const useAuthSession = () => {
  
  const { data: session } = useSession();



  const user = session?.user as Session['user']

  const token = session?.user?.accessToken

  // if(!user) {
  //   router.push('/auth/signin')
  // }

  return { user, token}
}

export default useAuthSession
