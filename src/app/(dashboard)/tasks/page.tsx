import {pageMetadata} from '@/lib/seo';
import PageClient from './PageClient';
import {getServerSession} from '@/lib/server-session';
import {getEngagementTasks} from '@/lib/tasks';
export const metadata=pageMetadata('Engagement tasks','Complete verified engagement tasks and earn Kwonnet bonus coins.','/tasks',false);
export default async function Page() {
 const session=await getServerSession();
 const initialTasks=session?.user?.accessToken
  ? await getEngagementTasks(session.user.accessToken).catch(()=>undefined)
  : undefined;
 return <PageClient initialTasks={initialTasks} initialUserId={session?.user?.id} />;
}
