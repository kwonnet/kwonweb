import {getServerSession} from '@/lib/server-session';
import {apiUrl} from '@/config';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const connection = new AbortController();
  const abort = () => connection.abort();
  request.signal.addEventListener('abort', abort, {once: true});
  const cleanup = () => request.signal.removeEventListener('abort', abort);
  try {
    const session = await getServerSession();
    if (!session?.user?.accessToken) {cleanup();return new Response('Sign in required', {status: 401});}
    const params = new URL(request.url).searchParams;
    const feed = params.get('feed');
    if (feed && !['foryou', 'following', 'friends', 'trending', 'latest'].includes(feed)) {cleanup();return new Response('Invalid feed', {status: 400});}
    const path = feed ? `/posts/feed/${feed}/available/stream?${new URLSearchParams({since: params.get('since') ?? new Date().toISOString(), known: params.get('known') ?? ''})}` : '/stream';
    if (request.signal.aborted) connection.abort();
    const upstream = await fetch(`${apiUrl}${path}`, {headers: {Authorization: `Bearer ${session.user.accessToken}`}, cache: 'no-store', signal: connection.signal});
    if (!upstream.ok || !upstream.body) {cleanup();connection.abort();return new Response('Stream unavailable', {status: upstream.ok ? 503 : upstream.status});}
    const reader = upstream.body.getReader();
    let closed = false;
    // Convert upstream socket termination into EOF so EventSource can reconnect;
    // never hand Next.js a body whose asynchronous read errors escape response piping.
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const chunk = await reader.read();
          if (closed) return;
          if (chunk.done) {closed = true;cleanup();controller.close();return;}
          controller.enqueue(chunk.value);
        } catch (error) {
          if (!closed && !request.signal.aborted) console.warn(JSON.stringify({
            event: 'sse_upstream_interrupted', feed: feed ?? 'interactions',
            errorType: error instanceof Error ? error.name : 'Unknown',
            code: typeof (error as {cause?: {code?: unknown}})?.cause?.code === 'string' ? (error as {cause: {code: string}}).cause.code : undefined,
          }));
          if (!closed) {closed = true;cleanup();controller.close();}
          connection.abort();
        }
      },
      async cancel() {closed = true;cleanup();connection.abort();await reader.cancel().catch(() => undefined);},
    });
    return new Response(body, {headers: {'Content-Type': 'text/event-stream', 'Cache-Control': 'private, no-store', 'X-Accel-Buffering': 'no'}});
  } catch {cleanup();connection.abort();return new Response('Stream unavailable', {status: 503});}
}
