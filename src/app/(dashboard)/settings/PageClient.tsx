'use client';
import React, {useEffect, useState} from 'react';
import {Alert, Box, Button, Chip, CircularProgress, Container, FormControlLabel, Paper, Stack, Switch, Typography} from '@mui/material';
import useSWR from 'swr';
import {useAuthSession} from '@/hooks';
import {subscribeUserToPush} from '@/utils/pushClient';
import {useNotifications} from '@/providers/NotificationsProvider';
import {getActiveSessions, revokeActiveSession, type ActiveUserSession} from '@/lib/auth';
import {logoutCurrentAccount} from '@/lib/account-actions';

export default function PageClient() {
  const {token, user} = useAuthSession();
  const notif = useNotifications();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const {data, error, isLoading, mutate} = useSWR(token && user ? ['active-sessions', user.id, token, page] : null,
    ([, , accessToken, currentPage]) => getActiveSessions(accessToken, currentPage), {revalidateOnFocus: true, dedupingInterval: 30_000});
  useEffect(() => {
    let cancelled = false;
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      void navigator.serviceWorker.getRegistration('/').then(registration => registration?.pushManager.getSubscription()).then(subscription => {
        if (!cancelled) setEnabled(!!subscription && Notification.permission === 'granted');
      }).catch(() => {});
    }
    return () => {cancelled = true;};
  }, []);
  const toggle = async (checked: boolean) => {
    setBusy(true);
    try {
      const result = await subscribeUserToPush(token, checked);
      if (result.status === 200) setEnabled(checked);
      notif.show(result.message, {severity: result.status === 200 ? 'success' : 'error'});
    } finally {setBusy(false);}
  };
  const revoke = async (session: ActiveUserSession) => {
    if (!token) return;
    setRevoking(session.id);
    try {
      await revokeActiveSession(token, session.id);
      if (session.current) {await logoutCurrentAccount(); return;}
      await mutate();
      notif.show('Session revoked.', {severity: 'success'});
    } catch {notif.show('Unable to revoke session. Please try again.', {severity: 'error'});}
    finally {setRevoking(null);}
  };
  return <Container maxWidth="md" sx={{py: 3}}>
    <Typography variant="h5" sx={{mb: 2}}>Settings</Typography>
    <Paper variant="outlined" sx={{p: {xs: 2, sm: 3}, mb: 3}}>
      <Typography variant="h6">Notifications</Typography>
      <FormControlLabel control={<Switch checked={enabled} disabled={busy || !token} onChange={(_, checked) => void toggle(checked)} />} label="Enable push notifications" />
      <Typography variant="body2" color="text.secondary">Receive notifications on this device, including when Kwonnet is closed.</Typography>
    </Paper>
    <Paper variant="outlined" sx={{p: {xs: 2, sm: 3}}}>
      <Typography variant="h6">Where you’re logged in</Typography>
      <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>Active sessions for your account. Revoke access on a device you no longer use. Locations are approximate.</Typography>
      {isLoading && <CircularProgress size={24} aria-label="Loading sessions" />}
      {error && <Alert severity="error" action={<Button onClick={() => void mutate()}>Retry</Button>}>Unable to load sessions.</Alert>}
      {data?.sessions.length === 0 && <Typography>No active sessions.</Typography>}
      {data?.sessions.map(session => <Stack key={session.id} direction={{xs: 'column', sm: 'row'}} spacing={2} sx={{py: 2, borderBottom: 1, borderColor: 'divider', alignItems: {sm: 'center'}}}>
        <Box sx={{flex: 1, minWidth: 0}}>
          <Stack direction="row" spacing={1} sx={{alignItems: "center"}}><Typography sx={{fontWeight: 600}}>{session.device?.browser || 'Unknown browser'} on {session.device?.os || 'unknown device'}</Typography>{session.current && <Chip size="small" color="primary" label="Current" />}</Stack>
          <Typography variant="body2" color="text.secondary">{[session.location?.city, session.location?.country].filter(Boolean).join(', ') || 'Location unavailable'} · {session.provider}</Typography>
          <Typography variant="body2" color="text.secondary">Last active {new Date(session.lastActiveAt).toLocaleString()}</Typography>
        </Box>
        <Button variant="outlined" color="error" disabled={revoking !== null} onClick={() => void revoke(session)}>{revoking === session.id ? 'Revoking…' : session.current ? 'Log out this device' : 'Revoke'}</Button>
      </Stack>)}
      <Stack direction="row" sx={{mt: 2, justifyContent: "space-between"}}>
        <Button disabled={page === 1 || isLoading} onClick={() => setPage(value => value - 1)}>Previous</Button>
        <Button disabled={!data?.hasMore || isLoading} onClick={() => setPage(value => value + 1)}>Next</Button>
      </Stack>
    </Paper>
  </Container>;
}
