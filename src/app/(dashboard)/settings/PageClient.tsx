'use client';
import React, {useEffect, useState} from 'react';
import {Alert, Box, Button, Chip, CircularProgress, Container, FormControlLabel, Paper, Stack, Switch, TextField, Typography} from '@mui/material';
import useSWR from 'swr';
import {useAuthSession} from '@/hooks';
import {subscribeUserToPush, testDeviceNotification} from '@/utils/pushClient';
import {useNotifications} from '@/providers/NotificationsProvider';
import {getAccountSettings, changePassword, getActiveSessions, revokeActiveSession, type ActiveUserSession} from '@/lib/auth';
import {signIn} from 'next-auth/react';
import {saveProfile} from '@/lib/profile-actions';
import useRefreshProfileIdentity from '@/hooks/useRefreshProfileIdentity';
import {logoutCurrentAccount} from '@/lib/account-actions';

export default function PageClient() {
  const {token, user} = useAuthSession();
  const notif = useNotifications();
  const refreshIdentity = useRefreshProfileIdentity();
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now);
  const {data: account, error: accountError, mutate: refreshAccount} = useSWR(token && user ? ['account-settings', user.id, token] : null, ([, , accessToken]) => getAccountSettings(accessToken), {revalidateOnMount: true, revalidateOnFocus: true});
  const verificationExpiresAt = account?.passwordSetupVerifiedUntil ? Date.parse(account.passwordSetupVerifiedUntil) : 0;
  const googleVerified = verificationExpiresAt > now;
  useEffect(() => {
    setNow(Date.now());
    if (!verificationExpiresAt) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, verificationExpiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [verificationExpiresAt]);
  const saveUsername = async (event: React.FormEvent) => {
    event.preventDefault(); if (saving) return;
    setSaving(true);
    let saved = false;
    try {
      const result = await saveProfile({username: username.trim().toLowerCase()});
      if (result.error || !result.profile) throw new Error(result.error || 'Unable to update username');
      saved = true;
      await refreshIdentity(result.profile);
      await refreshAccount();
      notif.show('Username updated.', {severity: 'success'});
      setUsername('');
    } catch (error) {
      if (saved) notif.show(error instanceof Error ? error.message : 'Username saved, but account refresh failed.', {severity: 'warning'});
      else notif.show(error instanceof Error ? error.message : 'Unable to update username', {severity: 'error'});
    }
    finally {setSaving(false);}
  };
  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault(); if (saving || !token || !account) return;
    if (newPassword !== confirmPassword) {notif.show('Passwords do not match.', {severity: 'error'}); return;}
    setSaving(true);
    try {
      const result = await changePassword(token, account?.hasPassword ? currentPassword : undefined, newPassword);
      if (result.reloginRequired) {await logoutCurrentAccount(); return;}
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      await refreshAccount(); await mutate();
      notif.show('Password updated. Other sessions have been signed out.', {severity: 'success'});
    } catch (error) {notif.show(error instanceof Error ? error.message : 'Unable to update password', {severity: 'error'});}
    finally {setSaving(false);}
  };
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const testNotification = async () => {
    setTestingNotification(true);
    try {
      await testDeviceNotification();
      notif.show('Test requested. If no device notification appears, check your browser’s notification settings in macOS and turn off Focus.', {severity: 'info', autoHideDuration: 10000});
    } catch (error) {
      notif.show(error instanceof Error ? error.message : 'Unable to display the test notification.', {severity: 'error'});
    } finally {setTestingNotification(false);}
  };
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
      <Typography variant="h6">Account</Typography>
      {accountError && <Alert severity="error" action={<Button onClick={() => void refreshAccount()}>Retry</Button>}>Unable to load account settings.</Alert>}
      <Box component="form" onSubmit={saveUsername} sx={{mt: 2}}>
        <TextField fullWidth label="New username" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" helperText={`Current: @${account?.username || user?.username || ''}. Use 3–30 letters, numbers or underscores.`} slotProps={{htmlInput: {minLength: 3, maxLength: 30, pattern: '[A-Za-z0-9_]{3,30}'}}} required />
        <Button type="submit" disabled={saving || !account || !username.trim()} sx={{mt: 1}}>Update username</Button>
      </Box>
      <Box component="form" onSubmit={savePassword} sx={{mt: 3}}>
        <Typography variant="subtitle1" sx={{mb: 1}}>Password</Typography>
        {account && !account.hasPassword && (googleVerified
          ? <Alert severity="success" sx={{mb: 2}}>Google verification complete. You can now set your password.</Alert>
          : <Alert severity="info" sx={{mb: 2}} action={<Button disabled={saving} onClick={() => void signIn("google", {redirectTo: "/settings"}).catch(() => notif.show("Unable to verify with Google. Please try again.", {severity: "error"}))}>Verify with Google</Button>}>Verify your account with Google, then set a password within five minutes.</Alert>)}
        <Stack spacing={2}>
          {account?.hasPassword && <TextField type="password" label="Current password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} autoComplete="current-password" required />}
          <TextField type="password" label="New password" value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" helperText="Use 8–32 characters." slotProps={{htmlInput: {minLength: 8, maxLength: 32}}} required />
          <TextField type="password" label="Confirm new password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" required />
        </Stack>
        <Button type="submit" disabled={saving || !account} sx={{mt: 1}}>Update password</Button>
      </Box>
    </Paper>
    <Paper variant="outlined" sx={{p: {xs: 2, sm: 3}, mb: 3}}>
      <Typography variant="h6">Notifications</Typography>
      <FormControlLabel control={<Switch checked={enabled} disabled={busy || !token} onChange={(_, checked) => void toggle(checked)} />} label="Enable push notifications" />
      <Typography variant="body2" color="text.secondary">Receive notifications on this device, including when Kwonnet is closed.</Typography>
      <Button disabled={!enabled || busy || testingNotification} onClick={() => void testNotification()} sx={{mt: 1}}>Test notification</Button>
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
