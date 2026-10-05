"use client";
import {useEffect, type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {isPublicLegalPath} from '@/lib/auth-redirect';
import {syncExistingPushSubscription, clearBrowserPushSubscription} from '@/utils/pushClient';
import {useSession} from 'next-auth/react';
export default function AuthSessionBoundary({initiallyAuthenticated, children}: {initiallyAuthenticated: boolean; children: ReactNode}) {
  const {status, data} = useSession();
  const token = data?.user?.accessToken;
  useEffect(() => {if (token) void syncExistingPushSubscription(token).catch(() => {});}, [token]);
  const legal = isPublicLegalPath(usePathname());
  const lostSession = initiallyAuthenticated && status === 'unauthenticated' && !legal;
  useEffect(() => {if (lostSession) void clearBrowserPushSubscription().catch(() => {}).finally(() => window.location.replace('/'));}, [lostSession]);
  // Never leave the previous account's private React tree mounted after revocation.
  return lostSession ? null : children;
}
