"use client";
import { useAuthSession } from "@/hooks";
import { getPostGifters } from "@/lib/posts";
import type { PostGiftersPage } from "@/types/post";
import { Alert, Avatar, Box, Button, Divider, List, ListItem, ListItemAvatar, ListItemText, Stack, Typography } from "@mui/material";
import Link from "next/link";
import useSWRInfinite from "swr/infinite";
import {useSWRConfig, unstable_serialize} from "swr";
import {useState} from "react";

export default function PageClient({postId, initialPage}: {postId: string; initialPage: PostGiftersPage}) {
  const {user, token} = useAuthSession();
  const {cache} = useSWRConfig();
  const [seededOnMount] = useState(() => cache.get(unstable_serialize({viewerId: user?.id, postId, kind: "gifters", page: 1}))?.data === undefined);
  const {data, error, isValidating, size, setSize, mutate} = useSWRInfinite(
    (index, previous: PostGiftersPage | null) => !user?.id || user.id !== initialPage.ownerId || !token || (previous && !previous.hasMore) ? null : {viewerId: user.id, postId, kind: "gifters", page: index + 1},
    ({page}) => getPostGifters(postId, page, token),
    {fallbackData: [initialPage], revalidateOnMount: seededOnMount ? false : undefined, revalidateFirstPage: false, revalidateOnFocus: false},
  );
  const pages = data ?? [initialPage];
  const overview = pages[pages.length - 1];
  const gifters = [...new Map(pages.flatMap(page => page.gifters).map(gift => [gift.id, gift])).values()];
  const last = pages[pages.length - 1];
  if (user?.id !== initialPage.ownerId) return <Alert severity="info">Only the post owner can view gifters.</Alert>;
  return <Box sx={{px: 2, py: 2}}>
    <Stack spacing={0.5} sx={{mb: 2}}>
      <Typography variant="h6">{overview.totalCoins} coins gifted to this post</Typography>
      <Typography color="text.secondary" variant="body2">{overview.totalGifts} {overview.totalGifts === 1 ? "gift" : "gifts"} · Only you can see this list</Typography>
      <Typography color="text.secondary" variant="caption">Gift values are in coins. Wallet payouts follow the tipping settlement rules.</Typography>
      {overview.hasEstimatedAmounts && <Alert severity="info">Older gift amounts are estimated using their package prices.</Alert>}
    </Stack>
    <Divider />
    {gifters.length === 0 && <Typography sx={{py: 3}} color="text.secondary">No gifts yet.</Typography>}
    <List disablePadding>
      {gifters.map(gift => <ListItem key={gift.id} alignItems="flex-start" divider sx={{px: 0, py: 2}}>
        <ListItemAvatar><Avatar src={gift.sender?.avatar ?? undefined} alt={gift.sender?.name ?? "Anonymous gifter"} /></ListItemAvatar>
        <ListItemText disableTypography primary={<Stack direction="row" sx={{justifyContent: "space-between", gap: 1}}>
          {gift.sender ? <Typography component={Link} href={`/@${gift.sender.username}`} color="text.primary" sx={{textDecoration: "none", fontWeight: 600}}>{gift.sender.name}</Typography> : <Typography sx={{fontWeight: 600}}>Anonymous gifter</Typography>}
          <Typography sx={{fontWeight: 600}} color="primary">{gift.coins} coins</Typography>
        </Stack>} secondary={<Stack spacing={0.5}>
          {gift.sender && <Typography variant="caption" color="text.secondary">@{gift.sender.username}</Typography>}
          <Typography variant="body2" color="text.secondary">{gift.gift} · {new Date(gift.createdAt).toLocaleDateString("en-GB", {dateStyle: "medium", timeZone: "UTC"})}</Typography>
          {gift.message && <Typography variant="body2" sx={{overflowWrap: "anywhere"}}>{gift.message}</Typography>}
        </Stack>} />
      </ListItem>)}
    </List>
    {error && <Alert severity="error" action={<Button onClick={() => void mutate()}>Retry</Button>}>Unable to load gifts. Please try again.</Alert>}
    {last.hasMore && <Button fullWidth variant="outlined" loading={isValidating} disabled={isValidating || pages.length !== size} onClick={() => void setSize(size + 1)} sx={{mt: 2}}>Load more gifters</Button>}
  </Box>;
}
