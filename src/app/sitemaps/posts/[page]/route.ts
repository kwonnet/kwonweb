export const dynamic = 'force-dynamic';
export async function GET() {
  // Disable previously advertised shards too; never fetch posts while paused.
  return new Response('Not found', {status: 404, headers: {'Cache-Control': 'no-store'}});
}
