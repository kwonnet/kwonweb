import {getServerSession} from '@/lib/server-session';
import {apiUrl} from '@/config';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.accessToken) return new Response('Sign in required', {status: 401});
    const params = new URL(request.url).searchParams;
    const feed = params.get('feed');
    if (feed && !['foryou', 'following', 'friends', 'trending', 'latest'].includes(feed)) return new Response('Invalid feed', {status: 400});
    const path = feed ? `/posts/feed/${feed}/available/stream?${new URLSearchParams({since: params.get('since') ?? new Date().toISOString()})}` : '/stream';
    const upstream = await fetch(`${apiUrl}${path}`, {headers: {Authorization: `Bearer ${session.user.accessToken}`}, cache: 'no-store', signal: request.signal});
    if (!upstream.ok) return new Response('Stream unavailable', {status: upstream.status});
    return new Response(upstream.body, {headers: {'Content-Type': 'text/event-stream', 'Cache-Control': 'private, no-store', 'X-Accel-Buffering': 'no'}});
  } catch {return new Response('Stream unavailable', {status: 503});}
}
