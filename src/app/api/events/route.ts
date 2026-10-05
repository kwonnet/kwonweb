import {getServerSession} from '@/lib/server-session';
import {apiUrl} from '@/config';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.accessToken) return new Response('Sign in required', {status: 401});
    const upstream = await fetch(`${apiUrl}/stream`, {headers: {Authorization: `Bearer ${session.user.accessToken}`}, cache: 'no-store', signal: request.signal});
    if (!upstream.ok) return new Response('Stream unavailable', {status: upstream.status});
    return new Response(upstream.body, {headers: {'Content-Type': 'text/event-stream', 'Cache-Control': 'private, no-store', 'X-Accel-Buffering': 'no'}});
  } catch {return new Response('Stream unavailable', {status: 503});}
}
