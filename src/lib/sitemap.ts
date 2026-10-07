import {siteOrigin} from './seo';
export const xmlEscape = (value: string) => value.replace(/[<>&"']/g, char => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]!));
export function sitemapIndex(pages: number) {
  const urls = ['/sitemaps/static/sitemap.xml', ...Array.from({length: pages}, (_, page) => `/sitemaps/posts/${page}.xml`)];
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(path => `<sitemap><loc>${xmlEscape(siteOrigin() + path)}</loc></sitemap>`).join('')}</sitemapindex>`;
}
export function postSitemap(posts: {id: string; updatedAt: string; user: {username: string}}[]) {
  const entries = new Map<string, string>();
  for (const post of posts) {
    if (typeof post.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(post.id) || typeof post.user?.username !== 'string' || !/^[a-zA-Z0-9_.-]{1,100}$/.test(post.user.username)) continue;
    const url = `${siteOrigin()}/@${encodeURIComponent(post.user.username)}/feed/${encodeURIComponent(post.id)}`;
    const date = new Date(post.updatedAt);
    entries.set(url, `<url><loc>${xmlEscape(url)}</loc>${Number.isFinite(date.getTime()) && date.getTime() <= Date.now() ? `<lastmod>${date.toISOString()}</lastmod>` : ''}</url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...entries.values()].join('')}</urlset>`;
}
export const sitemapHeaders = {'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store'};
