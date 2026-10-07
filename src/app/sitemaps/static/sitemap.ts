import type {MetadataRoute} from 'next';
import {siteOrigin} from '@/lib/seo';
export const dynamic = 'force-dynamic';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/privacy-policy', '/terms-of-service'].map(path => ({url: siteOrigin() + path}));
}
