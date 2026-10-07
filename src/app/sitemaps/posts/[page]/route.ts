import {getPublicPostMetadataIndex} from '@/lib/posts';
import {postSitemap, sitemapHeaders} from '@/lib/sitemap';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, {params}: {params: Promise<{page: string}>}) {
  const {page} = await params;
  if (!/^\d+\.xml$/.test(page)) return new Response('Not found', {status: 404});
  const number = Number(page.slice(0,-4));
  if (!Number.isSafeInteger(number) || number < 0 || number >= 50000) return new Response('Not found', {status: 404});
  const posts = await getPublicPostMetadataIndex(number);
  if (!Array.isArray(posts)) return new Response('Sitemap temporarily unavailable', {status: 503, headers: {'Retry-After': '60', 'Cache-Control': 'no-store'}});
  return new Response(postSitemap(posts), {headers: sitemapHeaders});
}
