'use client';
import { Suspense, useEffect, useState } from 'react';
import { Autocomplete, Avatar, Box, CircularProgress, IconButton, ListItemAvatar, ListItemText, TextField } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useAuthSession } from '@/hooks';
import { searchUsers } from '@/lib/users';
import { searchHref } from '@/utils/post-text';

function SearchInput() {
  const params = useSearchParams();
  const pathname = usePathname();
  const routeQuery = pathname === '/search' ? (params.get('q') ?? '').slice(0, 200) : '';
  const [draft, setDraft] = useState({ routeQuery, value: routeQuery });
  const value = draft.routeQuery === routeQuery ? draft.value : routeQuery;
  const query = value.trim();
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const { user, token } = useAuthSession();
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const ready = focused && !!query && query === debounced;
  const { data = [], error, isLoading } = useSWR(
    ready ? ['search-user-dropdown', user?.id ?? 'guest', debounced] : null,
    ([, , keyword]) => searchUsers({ query: keyword, limit: 6 }, token),
    { dedupingInterval: 30_000, revalidateOnFocus: false, keepPreviousData: false, errorRetryCount: 1 },
  );
  const loading = !!query && (query !== debounced || isLoading);
  const close = () => { setFocused(false); setOpen(false); };
  const submit = () => { if (query) { router.push(searchHref(query, 'typed_query')); close(); } };
  return <>
    <IconButton aria-label="Open search" onClick={() => { if (open) close(); else setOpen(true); }} sx={{ display: { xs: 'inline-flex', lg: 'none' } }}><SearchOutlinedIcon /></IconButton>
    <Box component="form" onSubmit={event => { event.preventDefault(); submit(); }} sx={{ display: { xs: open ? 'flex' : 'none', lg: 'flex' }, position: { xs: 'absolute', lg: 'relative' }, width: { xs: 'calc(100% - 32px)', lg: 'clamp(240px, 28vw, 440px)' }, maxWidth: { xs: 440, lg: 440 }, left: { xs: '50%', lg: 'auto' }, transform: { xs: 'translateX(-50%)', lg: 'none' }, top: { xs: 64, lg: 'auto' }, flexShrink: 1 }}>
      <Autocomplete fullWidth value={null} inputValue={value} options={ready ? data : []} filterOptions={options => options}
        open={focused && !!query} onOpen={() => setFocused(true)} onClose={() => setFocused(false)}
        onInputChange={(_, text, reason) => { if (reason === 'input' || reason === 'clear') setDraft({ routeQuery, value: text.slice(0, 200) }); }}
        getOptionLabel={option => typeof option === 'string' ? option : `${option.name} @${option.username}`}
        onChange={(_, option) => { if (typeof option === 'string') submit(); else if (option) { router.push(`/@${encodeURIComponent(option.username)}`); close(); } }}
        onKeyDown={event => {
          // Enter always submits the typed query; choosing a dropdown user opens their profile.
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.defaultMuiPrevented = true; event.preventDefault(); submit(); }
          if (event.key === 'Escape') close();
        }}
        loading={loading} loadingText="Searching people…" noOptionsText={error ? 'Unable to search people. Try again.' : 'No matching people.'}
        slotProps={{ popper: { sx: { zIndex: theme => theme.zIndex.modal + 1 } } }}
        renderOption={(props, person) => {
          const { key, ...rest } = props;
          return <Box component="li" key={key} {...rest}><ListItemAvatar><Avatar src={person.avatar || undefined} alt={person.name} /></ListItemAvatar><ListItemText primary={person.name} secondary={`@${person.username}`} /></Box>;
        }}
        renderInput={props => <TextField {...props} size="small" label="Search" onFocus={() => setFocused(true)} slotProps={{
          ...props.slotProps,
          htmlInput: { ...props.slotProps.htmlInput, maxLength: 200 },
          input: { ...props.slotProps.input, sx: { borderRadius: 30, bgcolor: 'background.paper' }, endAdornment: <>{loading && <CircularProgress size={18} />}<IconButton type="submit" aria-label="Search"><SearchOutlinedIcon /></IconButton>{props.slotProps.input.endAdornment}</> },
        }} />}
      />
    </Box>
  </>;
}
export default function SearchToolbar() {
  return <Suspense fallback={null}><SearchInput /></Suspense>;
}
