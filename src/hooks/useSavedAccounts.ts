"use client";
import useSWR from "swr";
import type { AccountProfile } from "@/lib/saved-accounts";

async function fetchSavedAccounts([url]: readonly [string, string]): Promise<AccountProfile[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load saved accounts. Please try again.");
  return response.json();
}

export default function useSavedAccounts(userId?: string) {
  return useSWR<AccountProfile[]>(userId ? ["/api/accounts", userId] as const : null, fetchSavedAccounts, {
    // Cache safe profile metadata in memory, separately for each active identity.
    // Reopening the menu within a minute shares the data and any pending request.
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 2,
  });
}
