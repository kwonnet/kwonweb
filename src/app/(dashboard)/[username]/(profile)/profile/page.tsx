import {pageMetadata} from '@/lib/seo';
import { redirect } from 'next/navigation';

// Preserve links to the old, unfinished profile-edit tab.
export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  redirect(`/${encodeURIComponent(decodeURIComponent(username))}/edit`);
}

export async function generateMetadata({params}: {params: Promise<{username: string}>}) {
  const p = await params;
  return pageMetadata('Profile information', 'View profile information on Kwonnet.', "/" + encodeURIComponent(p.username) + "/" + 'profile', false);
}
