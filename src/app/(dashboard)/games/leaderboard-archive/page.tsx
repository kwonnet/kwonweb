import {pageMetadata} from '@/lib/seo';
import { getServerSession } from '@/lib/server-session';
import { apiUrl } from '@/config';
import type { GameRankingArchiveStats, GameArchiveUser } from '@/types';
import DisplayError from '@/components/common/DisplayError';
import PageClient from './PageClient';
export default async function Page() {
 const session = await getServerSession();
 const headers = session?.user?.accessToken ? { Authorization: `Bearer ${session.user.accessToken}` } : undefined;
 const response = await fetch(`${apiUrl}/games/categories/ranking-archive/stats`, { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
 if (!response.ok && response.status !== 404) return <DisplayError status={response.status} message="Unable to load archived rankings." />;
 const initialStats: GameRankingArchiveStats[] = response.status === 404 ? [] : await response.json();
 const year = initialStats[0], month = year?.stats[0], category = month?.categories[0];
 let initialPage: { query: string; data: GameArchiveUser[] } | undefined;
 if (year && month && category) {
  const query = `type=ranking-archieve&catId=${category.cat.id}&limit=15&year=${year.year}&month=${month.month}&page=1`;
  const players = await fetch(`${apiUrl}/games/categories/ranking-archive?${query}`, { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!players.ok && players.status !== 404) return <DisplayError status={players.status} message="Unable to load archived players." />;
  initialPage = { query, data: players.status === 404 ? [] : await players.json() };
 }
 return <PageClient initialStats={initialStats} initialPage={initialPage} />;
}
export const metadata = pageMetadata('Leaderboard archive', 'Archived leaderboard on Kwonnet.', '/games/leaderboard-archive', false);
