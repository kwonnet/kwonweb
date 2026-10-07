import {getPublicPostSitemapCount} from '@/lib/posts';
import {sitemapIndex, sitemapHeaders} from '@/lib/sitemap';
export const dynamic = 'force-dynamic';
export async function GET() {
  const pages = await getPublicPostSitemapCount();
  if (pages === null) return new Response('Sitemap temporarily unavailable', {status: 503, headers: {'Retry-After': '60', 'Cache-Control': 'no-store'}});
  return new Response(sitemapIndex(pages), {headers: sitemapHeaders});
}
