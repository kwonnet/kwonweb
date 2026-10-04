"use server";
import { auth } from '@/auth';
import { apiUrl } from '@/config';
import { revalidatePath, updateTag } from 'next/cache';
import type { EditableProfile, ProfileChanges } from '@/types/profile';

export async function saveProfile(changes: ProfileChanges): Promise<{ profile?: EditableProfile; error?: string }> {
  const session = await auth();
  if (!session?.user?.accessToken) return { error: 'Please sign in before editing your profile.' };
  try {
    const response = await fetch(`${apiUrl}/users/me/profile`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.user.accessToken}` },
      body: JSON.stringify(changes), cache: 'no-store', signal: AbortSignal.timeout(15_000),
    });
    const result = await response.json();
    if (!response.ok) return { error: result.error || 'Unable to update profile.' };
    const profile = result as EditableProfile;
    for (const username of new Set([session.user.username, profile.username])) {
      if (!username) continue;
      for (const prefix of ['', '@', '%40']) updateTag(`user-${prefix}${username}`);
      revalidatePath(`/@${username}`, 'layout');
    }
    return { profile };
  } catch { return { error: 'Unable to save your profile. Please try again.' }; }
}
