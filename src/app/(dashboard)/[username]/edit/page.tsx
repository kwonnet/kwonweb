import {pageMetadata} from '@/lib/seo';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/server-session';
import { apiUrl } from '@/config';
import ProfileEditor from '@/components/profile/ProfileEditor';
import ErrorMessage from '@/components/common/ErrorMessage';
import type { ProfileEditData } from '@/types/profile';

export default async function EditProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const session = await getServerSession();
  if (!session?.user?.accessToken) redirect('/?auth=signin');
  const { username } = await params;
  if (decodeURIComponent(username).replace(/^@/, '').toLowerCase() !== session.user.username.toLowerCase()) redirect(`/@${session.user.username}/edit`);
  let initial: ProfileEditData | null = null;
  try {
    const response = await fetch(`${apiUrl}/users/me/profile`, { headers: { Authorization: `Bearer ${session.user.accessToken}` }, cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    if (response.ok) initial = await response.json() as ProfileEditData;
  } catch { /* Show a recoverable load error below. */ }
  return initial ? <ProfileEditor initial={initial} /> : <ErrorMessage message="Unable to load your profile. Please refresh and try again." />;
}

export async function generateMetadata({params}: {params: Promise<{username: string}>}) {
  const p = await params;
  return pageMetadata('Edit profile', 'View edit profile on Kwonnet.', "/" + encodeURIComponent(p.username) + "/" + 'edit', false);
}
