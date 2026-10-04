import { redirect } from 'next/navigation';

// Preserve links to the old, unfinished profile-edit tab.
export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  redirect(`/${encodeURIComponent(decodeURIComponent(username))}/edit`);
}
