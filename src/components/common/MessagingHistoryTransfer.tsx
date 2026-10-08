"use client";
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Divider, Stack, Tab, Tabs, Typography } from '@mui/material';
import PasswordTextField from './PasswordTextField';
import { exportMessagingHistory, importMessagingHistory, MAX_HISTORY_FILE_BYTES } from '@/lib/signal/history';

export default function MessagingHistoryTransfer({userId, onRestored}: {userId: string; onRestored: () => void}) {
  const [mode, setMode] = useState<'export' | 'restore'>('export');
  const [passphrase, setPassphrase] = useState(''), [confirmation, setConfirmation] = useState('');
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => {mounted.current = false;}; }, []);
  const run = async () => {
    setBusy(true); setError(''); setSuccess('');
    try {
      if (mode === 'export') {
        if (passphrase !== confirmation) throw new Error('Transfer passphrases do not match');
        const blob = await exportMessagingHistory(userId, passphrase);
        if (!mounted.current) return;
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = `kwonnet-history-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        setSuccess('Encrypted history exported. Transfer the file to your new device and keep the passphrase separately.');
      } else {
        if (!file) throw new Error('Choose an encrypted history file');
        const result = await importMessagingHistory(userId, file, passphrase);
        if (!mounted.current) return;
        onRestored();
        setSuccess(`Restored ${result.restored} messages and actions across ${result.conversations} conversations.`);
        setFile(undefined);
      }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error && !(cause instanceof SyntaxError) && cause.name !== 'ZodError' ? cause.message : 'Invalid encrypted history file');
    } finally {
      if (mounted.current) {setBusy(false); setPassphrase(''); setConfirmation('');}
    }
  };
  return <Stack spacing={2} sx={{mt: 3}}>
    <Divider />
    <Typography variant="h6">Transfer older messages</Typography>
    <Typography variant="body2">Export from your existing device, then sign into the same account, set up messaging and restore on the new device. Only history already loaded on this browser is included. Open chats first to load any missing history.</Typography>
    <Typography variant="body2">The file includes message content and attachment keys, encrypted with a separate transfer passphrase. Device keys stay on their original device. Attachment downloads require the original files to still be available.</Typography>
    <Tabs value={mode} onChange={(_, value) => {setMode(value); setPassphrase(''); setConfirmation(''); setError(''); setSuccess(''); setFile(undefined);}} aria-label="History transfer action">
      <Tab value="export" label="Export history" disabled={busy} /><Tab value="restore" label="Restore history" disabled={busy} />
    </Tabs>
    {error && <Alert severity="error">{error}</Alert>}
    {success && <Alert severity="success">{success}</Alert>}
    {mode === 'restore' && <>
      <Button component="label" disabled={busy}>Choose encrypted history file
        <input type="file" hidden accept=".json,application/json" onChange={event => {
          const selected = event.target.files?.[0]; event.target.value = '';
          if (selected && selected.size > MAX_HISTORY_FILE_BYTES) {setFile(undefined); setError('History file is too large (maximum 48 MB).');}
          else {setFile(selected); setError('');}
        }} />
      </Button>
      <Typography variant="body2">{file?.name ?? 'No file selected'}</Typography>
    </>}
    <PasswordTextField label="Transfer passphrase" value={passphrase} disabled={busy} onChange={event => setPassphrase(event.target.value)} autoComplete={mode === 'export' ? 'new-password' : 'off'} slotProps={{htmlInput: {maxLength: 1024}}} helperText="Use at least 12 characters. This can differ from your messaging passphrase." />
    {mode === 'export' && <PasswordTextField label="Confirm transfer passphrase" value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} autoComplete="new-password" slotProps={{htmlInput: {maxLength: 1024}}} />}
    <Button loading={busy} variant="contained" disabled={busy || passphrase.length < 12 || (mode === 'export' ? passphrase !== confirmation : !file)} onClick={run}>
      {mode === 'export' ? 'Export encrypted history' : 'Restore encrypted history'}
    </Button>
    <Typography variant="caption">Restoring merges history without replacing live encryption sessions or sending messages. Backups are snapshots: changes made after export require a fresh export. Keep the file and passphrase safe; account password resets cannot recover them.</Typography>
  </Stack>;
}
