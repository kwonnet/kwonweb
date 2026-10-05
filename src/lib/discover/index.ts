import { apiUrl } from "@/config";
import type { TrendingTopics } from "@/types";

export async function getTrendingTopics(args: { country?: string | null; limit: number; mode?: "foryou"; topic?: string }, accessToken?: string): Promise<TrendingTopics[]> {
  const query = new URLSearchParams({ limit: String(args.limit) });
  if (args.mode) query.set("mode", args.mode);
  if (args.topic) query.set("topic", args.topic);
  if (args.country) query.set("country", args.country);
  const response = await fetch(`${apiUrl}/discover/trend?${query}`, {
    cache: "no-store",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    signal: AbortSignal.timeout(8000),
  });
  // Compatibility while the backend's empty-collection response rolls out.
  if (response.status === 404) return [];
  if (!response.ok) throw new Error("Unable to load trending topics.");
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("Invalid trending topics response.");
  return data as TrendingTopics[];
}

export async function getSidebarTrends(args: { country?: string | null; limit: number }, accessToken?: string) {
  const local = await getTrendingTopics(args, accessToken);
  return local.length || !args.country ? local : getTrendingTopics({ limit: args.limit }, accessToken);
}
