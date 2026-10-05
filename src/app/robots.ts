import type {MetadataRoute} from 'next';
import {siteOrigin} from '@/lib/seo';
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  return {rules: {userAgent: '*', allow: '/', disallow: ['/api/', '/settings', '/wallet', '/messages/', '/history', '/notifications', '/auth/', '/search', '/*/edit', '/*/analytics', '/*/gifters']}, sitemap: `${siteOrigin()}/sitemap.xml`, host: siteOrigin()};
}
