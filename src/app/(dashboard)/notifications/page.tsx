import {pageMetadata} from '@/lib/seo';
import { getServerSession } from '@/lib/server-session';
import { apiUrl } from '@/config';
import DisplayError from '@/components/common/DisplayError';
import PageClient from './PageClient';
export default async function Page() {
  const session = await getServerSession();
  if (!session?.user?.accessToken) return <DisplayError status={401} message="Sign in to view notifications." />;
  const response = await fetch(`${apiUrl}/users/${session.user.id}/notifications?limit=21&page=1`, { cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${session.user.accessToken}` } });
  if (!response.ok) return <DisplayError status={response.status} message="Unable to load notifications." />;
  return <PageClient items={await response.json()} initialUserId={session.user.id} />;
}
export const metadata = pageMetadata('Notifications', 'Notifications on Kwonnet. Connect with your community and manage your experience.', '/notifications', false);
