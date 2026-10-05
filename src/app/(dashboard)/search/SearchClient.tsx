'use client';
import { Alert, Avatar, Box, Button, CircularProgress, List, ListItemButton, ListItemAvatar, ListItemText, Tabs, Tab, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWRInfinite from 'swr/infinite';
import { useAuthSession } from '@/hooks';
import { searchPosts } from '@/lib/posts';
import { searchUsers } from '@/lib/users';
import { searchHref } from '@/utils/post-text';
import { FeedTypeEnum } from '@/types/post';
import type { FeedPost } from '@/types';
import type { PublicPostPreview } from '@/utils/public-feed';
import FeedsDisplay from '@/components/post/FeedsDisplay';
import GuestFeed from '@/components/post/GuestFeed';
import FeedSkeleton from '@/components/post/FeedSkeleton';
type Person = Awaited<ReturnType<typeof searchUsers>>[number];
export default function SearchClient({ q, tab, posts, people, failed }: {
  q: string; tab: 'top' | 'latest' | 'people'; posts: FeedPost[]; people: Person[]; failed: boolean;
}) {
  const { user, token } = useAuthSession();
  const router = useRouter();
  const { data, error, isValidating, size, setSize, mutate } = useSWRInfinite<(Person | FeedPost)[]>(
    (index, previous) => !q || (tab !== 'people' && user?.id) || (previous && previous.length < 21) ? null :
      { search: q, tab, page: index + 1, viewer: user?.id ?? 'guest' },
    args => tab === 'people' ? searchUsers({ query: q, page: args.page, limit: 21 }, token) :
      searchPosts({ q, tab, page: args.page }, token).then(result => result.posts),
    { fallbackData: [tab === 'people' ? people : posts], revalidateOnMount: failed, revalidateOnFocus: false, keepPreviousData: false },
  );
  const entries = [...new Map((data ?? [tab === 'people' ? people : posts]).flat().map(item => [item.id, item])).values()];
  return <Box sx={{ width: '100%', minWidth: 0, pb: 4 }}>
    <Tabs value={tab} variant="fullWidth" aria-label="Search results" sx={{ borderBottom: 1, borderColor: 'divider' }}>
      {(['top', 'latest', 'people'] as const).map(value => <Tab key={value} value={value} label={value} component={Link} href={searchHref(q, 'typed_query', value)} />)}
    </Tabs>
    {!q ? <Typography sx={{ p: 3 }} color="text.secondary">Search posts, hashtags and people.</Typography> : <>
      {(error || failed) && <Alert severity="error" action={<Button onClick={() => { void mutate(); router.refresh(); }}>Retry</Button>}>Unable to load search results.</Alert>}
      {tab !== 'people' && user?.id && !failed ? <FeedsDisplay posts={posts} feed={FeedTypeEnum.LATEST} search={{ q, tab }} /> : <>
        {!entries.length && !isValidating && !error && !failed && <Typography sx={{ p: 3 }} color="text.secondary">No results for “{q}”. Try another search.</Typography>}
        {tab === 'people' ? <List>{(entries as Person[]).map(person => <ListItemButton key={person.id} component={Link} href={`/@${encodeURIComponent(person.username)}`} alignItems="flex-start">
          <ListItemAvatar><Avatar src={person.avatar || undefined} alt={person.name} /></ListItemAvatar>
          <ListItemText primary={person.name} secondary={<><Typography component="span" sx={{ display: "block" }} variant="body2">@{person.username}</Typography>{person.bio}</>} />
        </ListItemButton>)}</List> : entries.length > 0 && <GuestFeed posts={entries as unknown as PublicPostPreview[]} searchResults />}
        {isValidating && !entries.length && <FeedSkeleton />}
        {!!entries.length && (data?.at(-1)?.length ?? 0) === 21 && <Box sx={{ textAlign: 'center', p: 2 }}><Button disabled={isValidating} onClick={() => void setSize(size + 1)}>{isValidating ? <CircularProgress size={20} /> : 'Load more'}</Button></Box>}
      </>}
    </>}
  </Box>;
}
