"use client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import type { Session } from "next-auth";
import {useEffect, useRef, type ReactNode} from "react";
import { NotificationsProvider } from "./NotificationsProvider";
import theme from "./theme";
import { SWRConfig, useSWRConfig, unstable_serialize } from "swr";
import {useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {updateProfileCache} from '@/utils/profile-cache';

const readCacheOptions = { dedupingInterval: 30_000, focusThrottleInterval: 30_000 };

function IdentityCacheSync() {
  const {data} = useSession();
  const {mutate, cache} = useSWRConfig();
  const router = useRouter();
  const previous = useRef<{id: string; signature: string} | null>(null);
  useEffect(() => {
    const user = data?.user;
    if (!user) {previous.current = null; return;}
    const identity = {id: user.id, name: user.name, username: user.username, avatar: user.avatar ?? null,
      bio: user.bio, banner: user.banner, website: user.website,
      country: user.country ?? null, countryId: user.country?.id ?? null};
    const signature = JSON.stringify(identity);
    if (previous.current?.signature === signature) return;
    const changed = previous.current?.id === user.id;
    previous.current = {id: user.id, signature};
    // NextAuth broadcasts session updates to other tabs. Keep their cached cards
    // and linked menus current without refetching every endpoint on token renewal.
    // Mutating pending/unrelated keys cancels their fetches, leaving settings
    // without account data after an OAuth redirect. Patch only loaded identities.
    void mutate(key => {
      const cached = cache.get(unstable_serialize(key))?.data;
      return cached !== undefined && updateProfileCache(cached, identity) !== cached;
    }, (cached: unknown) => updateProfileCache(cached, identity), {revalidate: false}).catch(() => {});
    if (changed) router.refresh();
  }, [data?.user, mutate, cache, router]);
  return null;
}

export default function NextjsAppProvider({ children }: { children: ReactNode; session?: Session | null }) {
  return <>
    <InitColorSchemeScript attribute="data-toolpad-color-scheme" defaultMode="system" />
    <ThemeProvider theme={theme} defaultMode="system" disableTransitionOnChange>
      <CssBaseline />
      <SWRConfig value={readCacheOptions}><IdentityCacheSync /><NotificationsProvider>{children}</NotificationsProvider></SWRConfig>
    </ThemeProvider>
  </>;
}
