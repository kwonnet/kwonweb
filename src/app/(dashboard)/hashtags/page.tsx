import {pageMetadata} from '@/lib/seo';
import { redirect } from 'next/navigation';
import { searchHref } from '@/utils/post-text';
export default async function Page({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  redirect(searchHref(tag ? `#${tag.replace(/^#/, '')}` : '', 'hashtag_click'));
}

export const metadata = pageMetadata('Hashtags', 'Hashtags on Kwonnet. Connect with your community and manage your experience.', '/hashtags', false);
