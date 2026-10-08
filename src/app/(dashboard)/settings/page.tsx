import {pageMetadata} from '@/lib/seo';
import React from 'react'
import { getServerSession } from '@/lib/server-session';
import { apiUrl } from '@/config';
import DisplayError from '@/components/common/DisplayError';
import PageClient from './PageClient'

const Page = async () => {
  const session = await getServerSession();
  const token = session?.user?.accessToken;
  if (!token) return <DisplayError status={401} message="Sign in to manage settings." />;
  const headers = { Authorization: `Bearer ${token}` };
  const [account, sessions] = await Promise.all([
    fetch(`${apiUrl}/auth/settings`, { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) }),
    fetch(`${apiUrl}/auth/sessions?page=1`, { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) }),
  ]);
  const [initialAccount, initialSessions] = await Promise.all([
    account.ok ? account.json() : undefined,
    sessions.ok ? sessions.json() : undefined,
  ]);
  return <PageClient initialUserId={session.user.id} initialAccount={initialAccount} initialSessions={initialSessions} />;
};

export default Page
export const metadata = pageMetadata('Settings', 'Manage your Kwonnet account, password, username, notifications and active login sessions.', '/settings', false);
