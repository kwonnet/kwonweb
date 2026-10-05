import type {MetadataRoute} from 'next';
import {siteOrigin} from '@/lib/seo';
import {publicPostIndex} from '@/lib/seo-data';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const posts = await publicPostIndex();
  return [...['/', '/privacy-policy', '/terms-of-service'].map(path => ({url: `${origin}${path}`})),
    ...(Array.isArray(posts) ? posts.filter(post => typeof post.id === 'string' && typeof post.user?.username === 'string').map(post => ({url: `${origin}/@${encodeURIComponent(post.user.username)}/feed/${encodeURIComponent(post.id)}`, lastModified: new Date(post.updatedAt)})) : [])];
}
