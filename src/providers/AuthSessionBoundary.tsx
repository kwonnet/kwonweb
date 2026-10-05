"use client";
import {useEffect, type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {isPublicLegalPath} from '@/lib/auth-redirect';
import {useSession} from 'next-auth/react';
export default function AuthSessionBoundary({initiallyAuthenticated, children}: {initiallyAuthenticated: boolean; children: ReactNode}) {
  const {status} = useSession();
  const legal = isPublicLegalPath(usePathname());
  const lostSession = initiallyAuthenticated && status === 'unauthenticated' && !legal;
  useEffect(() => {if (lostSession) window.location.replace('/');}, [lostSession]);
  // Never leave the previous account's private React tree mounted after revocation.
  return lostSession ? null : children;
}
