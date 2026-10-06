"use client";
import {useSession} from 'next-auth/react';
import {useSWRConfig} from 'swr';
import {useRouter} from 'next/navigation';
import {rememberCurrentAccount} from '@/lib/account-actions';
import {updateProfileCache} from '@/utils/profile-cache';
import type {EditableProfile} from '@/types/profile';

export default function useRefreshProfileIdentity() {
  const {update} = useSession();
  const {mutate} = useSWRConfig();
  const router = useRouter();
  return async (saved: EditableProfile) => {
    const session = await update({refreshIdentity: true});
    const user = session?.user;
    // Auth.js preserves a valid old session on backend outages. Do not mistake
    // that fallback for a successful refresh or overwrite the saved account with it.
    if (!user || user.id !== saved.id || user.username !== saved.username ||
        user.name !== saved.name || (user.avatar ?? null) !== saved.avatar ||
        (user.country?.id ?? null) !== saved.countryId)
      throw new Error('Profile saved, but account refresh failed. Please refresh the page.');
    await mutate(() => true, (cached: unknown) => updateProfileCache(cached, {...saved, country: user.country ?? null}), {revalidate: false});
    await rememberCurrentAccount();
    await mutate(key => Array.isArray(key) && key[0] === '/api/accounts');
    router.refresh();
  };
}
