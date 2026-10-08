"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Add, Close } from "@mui/icons-material";
import { Alert, Avatar, Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, List, ListItemButton, ListItemAvatar, ListItemText, TextField, Typography } from "@mui/material";
import { useAuthSession } from "@/hooks";
import { getMessagingFriends, searchUsers } from "@/lib/users";

type Person = { id: string; name: string; username: string; avatar?: string | null };

function PeopleList({ userId, token, query, onSelect }: {
  userId: string; token: string; query?: string; onSelect: (person: Person) => void;
}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const request = query === undefined
      ? getMessagingFriends(userId, page, token)
      : searchUsers({ query, page, limit: 20, scope: 'messaging' }, token);
    void request.then(results => {
      if (cancelled) return;
      setPeople(previous => {
        const merged = page === 1 ? results : [...previous, ...results];
        return [...new Map(merged.filter(person => person.id !== userId).map(person => [person.id, person])).values()];
      });
      setMore(results.length === 20);
    }).catch(() => {
      if (!cancelled) setError(query === undefined ? "Unable to load friends." : "Unable to search people.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, token, query, page, attempt]);

  return <Box>
    <List>
      {people.map(person => <ListItemButton key={person.id} onClick={() => onSelect(person)}>
        <ListItemAvatar><Avatar src={person.avatar ?? undefined} alt={person.name} /></ListItemAvatar>
        <ListItemText primary={person.name || person.username} secondary={`@${person.username}`} />
      </ListItemButton>)}
    </List>
    {loading && <Box role="status" aria-label="Loading people" sx={{textAlign: "center", p: 1}}><CircularProgress size={24} /></Box>}
    {error && <Alert severity="error" action={<Button onClick={() => setAttempt(value => value + 1)}>Retry</Button>}>{error}</Alert>}
    {!loading && !error && !people.length && <Typography color="text.secondary" sx={{p: 1}}>
      {query === undefined ? "No mutual followers yet. Search for anyone above." : "No matching users found."}
    </Typography>}
    {more && !error && <Button disabled={loading} onClick={() => setPage(value => value + 1)}>Load more</Button>}
  </Box>;
}

export default function NewConversationButton() {
  const { user, token } = useAuthSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const select = (person: Person) => {
    setOpen(false);
    router.push(`/messages/${encodeURIComponent(person.id)}/chat`);
  };

  return <>
    <Button startIcon={<Add />} onClick={() => { setQuery(""); setSearch(""); setOpen(true); }}>Start message</Button>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" aria-labelledby="new-conversation-title">
      <DialogTitle id="new-conversation-title" sx={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        Start a message<IconButton aria-label="Close user search" onClick={() => setOpen(false)}><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField autoFocus fullWidth label="Search users" placeholder="Name or username" value={query} onChange={event => setQuery(event.target.value)} slotProps={{htmlInput: {maxLength: 200}}} sx={{mt: 1, mb: 2}} />
        <Typography color="text.secondary" variant="body2" sx={{mb: 2}}>Messages to people who aren't mutual followers appear in their message requests.</Typography>
        {token && user?.id && <>
          {search && <Box sx={{mb: 2}}>
            <Typography variant="subtitle1">Search results</Typography>
            {query.trim() === search && <PeopleList key={`search:${user.id}:${search}`} userId={user.id} token={token} query={search} onSelect={select} />}
          </Box>}
          <Typography variant="subtitle1">Friends · mutual followers</Typography>
          <PeopleList key={`friends:${user.id}`} userId={user.id} token={token} onSelect={select} />
        </>}
      </DialogContent>
    </Dialog>
  </>;
}
