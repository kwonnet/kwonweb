import type {MetadataRoute} from 'next';
import {staticSitemapEntries} from '@/lib/sitemap';
export const dynamic = 'force-dynamic';
export default function sitemap(): MetadataRoute.Sitemap {
  return staticSitemapEntries();
}
