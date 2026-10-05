import {pageMetadata} from '@/lib/seo';
import { getServerSession } from '@/lib/server-session';
import { searchPosts } from '@/lib/posts';
import { searchUsers } from '@/lib/users';
import SearchClient from './SearchClient';
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 200) : '';
  const tab = params.tab === 'latest' || params.tab === 'people' ? params.tab : 'top';
  const session = await getServerSession();
  let posts: Awaited<ReturnType<typeof searchPosts>>['posts'] = [], people: Awaited<ReturnType<typeof searchUsers>> = [], failed = false;
  if (q) {
    try {
      if (tab === 'people') people = await searchUsers({ query: q, limit: 21 }, session?.user?.accessToken);
      else posts = (await searchPosts({ q, tab }, session?.user?.accessToken)).posts;
    } catch { failed = true; }
  }
  return <SearchClient key={`${session?.user?.id ?? 'guest'}:${q}:${tab}`} q={q} tab={tab} posts={posts} people={people} failed={failed} />;
}

export async function generateMetadata({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 120) : '';
  return pageMetadata(q ? `Search: ${q}` : 'Search', q ? `Search results for ${q} on Kwonnet.` : 'Search Kwonnet posts and people.', '/search', false);
}
