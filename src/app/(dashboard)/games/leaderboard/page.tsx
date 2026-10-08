import {pageMetadata} from '@/lib/seo';
import { getServerSession } from '@/lib/server-session';
import { apiUrl } from '@/config';
import { GameMode, GameRoomRankingEnum, type GameCategoryRanking, type GamePlayer } from '@/types';
import DisplayError from '@/components/common/DisplayError';
import PageClient from './PageClient';
export default async function Page() {
 const session = await getServerSession(), mode = GameMode.SINGLE, rankType = GameRoomRankingEnum.TODAY;
 const headers = session?.user?.accessToken ? { Authorization: `Bearer ${session.user.accessToken}` } : undefined;
 const response = await fetch(`${apiUrl}/games/categories/rankings?rankType=${rankType}&mode=${mode.toLowerCase()}`, { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
 if (!response.ok && response.status !== 404) return <DisplayError status={response.status} message="Unable to load leaderboard." />;
 const initialRankings: GameCategoryRanking[] = response.status === 404 ? [] : await response.json();
 let initialPage: { query: string; data: GamePlayer[] } | undefined;
 if (initialRankings[0]) {
  const query = `/v1/games/leaderboard?type=board-archive&ranking=${rankType}&mode=${mode}&catId=${initialRankings[0].id}&limit=15&page=1`;
  const players = await fetch(`${apiUrl}${query.slice(3)}`, { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!players.ok && players.status !== 404) return <DisplayError status={players.status} message="Unable to load leaderboard players." />;
  initialPage = { query, data: players.status === 404 ? [] : await players.json() };
 }
 return <PageClient initialRankings={initialRankings} initialPage={initialPage} />;
}
export const metadata = pageMetadata('Leaderboard', 'Leaderboard on Kwonnet.', '/games/leaderboard', false);
