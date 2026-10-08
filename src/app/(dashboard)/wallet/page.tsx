import {pageMetadata} from '@/lib/seo';
import React from 'react'
import { getServerSession } from '@/lib/server-session';
import { apiUrl } from '@/config';
import DisplayError from '@/components/common/DisplayError';
import { getNotificationStatsCached } from '@/components/common/NotificationServer';
import WalletClient from './WalletClient'
import { getCurrent_ton_usd_rate } from '@/utils'


const Page = async () => {
  const session = await getServerSession();
  if (!session?.user?.accessToken) return <DisplayError status={401} message="Sign in to view your wallet." />;
  const [tonRate, response, history, initialStats] = await Promise.all([
    getCurrent_ton_usd_rate().catch(() => 0),
    fetch(`${apiUrl}/wallets`, { cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${session.user.accessToken}` } }),
    fetch(`${apiUrl}/wallets/history?limit=20&page=1`, { cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${session.user.accessToken}` } }),
    getNotificationStatsCached(session.user.id, session.user.accessToken),
  ]);
  if (!response.ok) return <DisplayError status={response.status} message="Unable to load your wallet." />;
  return <WalletClient tonRate={tonRate || 0} initialWallet={await response.json()} initialTransactions={history.ok ? await history.json() : undefined} initialStats={initialStats} initialUserId={session.user.id} />;
};

export default Page
export const metadata = pageMetadata('Wallet', 'Wallet on Kwonnet. Connect with your community and manage your experience.', '/wallet', false);
