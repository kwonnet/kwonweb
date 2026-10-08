import {pageMetadata} from '@/lib/seo';
import { getServerSession } from '@/lib/server-session';
import { apiUrl } from '@/config';
import type { GameWinnersStats, GameWinner } from '@/types';
import DisplayError from '@/components/common/DisplayError';
import PageClient from './PageClient';
export default async function Page() {
  const session = await getServerSession();
  const headers = session?.user?.accessToken ? { Authorization: `Bearer ${session.user.accessToken}` } : undefined;
  const response = await fetch(`${apiUrl}/games/winners/stats`, { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok && response.status !== 404) return <DisplayError status={response.status} message="Unable to load winners." />;
  const initialStats: GameWinnersStats[] = response.status === 404 ? [] : await response.json();
  const year = initialStats[0], month = year?.stats[0], category = month?.categories[0];
  let initialPage: { query: string; data: GameWinner[] } | undefined;
  if (year && month && category) {
    const query = `type=winners&catId=${category.cat.id}&limit=15&year=${year.year}&month=${month.month}&page=1`;
    const players = await fetch(`${apiUrl}/games/winners?${query}`, { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!players.ok && players.status !== 404) return <DisplayError status={players.status} message="Unable to load winners." />;
    initialPage = { query, data: players.status === 404 ? [] : await players.json() };
  }
  return <PageClient initialStats={initialStats} initialPage={initialPage} />;
}
export const metadata = pageMetadata('Game winners', 'Game winners on Kwonnet. Connect with your community and manage your experience.', '/games/winners', false);
