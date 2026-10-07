import {sitemapIndex, sitemapHeaders} from '@/lib/sitemap';
export const dynamic = 'force-dynamic';
export async function GET() {
  // Temporarily publish static pages only, with no API/database dependency.
  return new Response(sitemapIndex(0), {headers: sitemapHeaders});
}
