import {pageMetadata} from '@/lib/seo';
import { getServerSession } from '@/lib/server-session';
import { apiUrl } from '@/config';
import DisplayError from '@/components/common/DisplayError';
import PageClient from './PageClient';
export default async function Page() {
  const session = await getServerSession();
  if (!session?.user?.accessToken) return <DisplayError status={401} message="Sign in to view rewards and tasks." />;
  const response = await fetch(`${apiUrl}/users/${session.user.id}/task-settings`, { cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${session.user.accessToken}` } });
  if (!response.ok) return <DisplayError status={response.status} message="Unable to load task settings." />;
  return <PageClient initialUserId={session.user.id} initialSettings={await response.json()} />;
}
export const metadata = pageMetadata('Game tasks', 'Game tasks on Kwonnet.', '/games/tasks', false);
