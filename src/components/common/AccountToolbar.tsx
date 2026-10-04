"use client";
import { useState } from "react";
import { Alert, Avatar, Box, Button, Dialog, DialogContent, DialogTitle, Divider, IconButton, ListItemIcon, ListItemText, MenuItem, MenuList, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import { useAuthSession } from "@/hooks";
import AuthForm from "@/components/auth/AuthForm";
import { logoutCurrentAccount, rememberCurrentAccount, switchAccount } from "@/lib/account-actions";
import type { AccountProfile } from "@/lib/saved-accounts";
import useSavedAccounts from "@/hooks/useSavedAccounts";

export default function AccountToolbar() {
  const { user } = useAuthSession();
  const { data: accounts = [], error, isLoading, mutate } = useSavedAccounts(user?.id);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [login, setLogin] = useState<{ username: string } | null>(null);
  // Auth callbacks already save the account. Opening a menu must not write cookies.

  async function selectAccount(account: AccountProfile) {
    if (busy || account.id === user?.id) return;
    setBusy(true); setMessage("");
    try {
      await rememberCurrentAccount();
      if (!await switchAccount(account.id)) setLogin({ username: account.username });
    } catch { setMessage("Unable to switch accounts. Please try again."); }
    finally { setBusy(false); }
  }
  async function logout() {
    if (busy) return;
    setBusy(true); setMessage("");
    try { await logoutCurrentAccount(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to sign out."); setBusy(false); }
  }
  return <Stack direction="column" spacing={1} sx={{ width: 280, maxWidth: "calc(100vw - 32px)" }}>
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", p: 2 }}>
      <Avatar src={user?.avatar || user?.image || undefined} alt={user?.name}>{user?.name?.[0]}</Avatar>
      <Box component={Link} href={`/@${user?.username}`} sx={{ textDecoration: "none", color: "inherit", minWidth: 0 }}>
        <Typography noWrap>{user?.name}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap>@{user?.username}</Typography>
      </Box>
    </Stack>
    <Divider />
    <Typography variant="subtitle2" sx={{ px: 2 }}>Accounts on this device</Typography>
    {isLoading && <Typography variant="caption" role="status" sx={{ px: 2 }}>Loading accounts…</Typography>}
    <MenuList aria-label="Saved accounts">
      {accounts.map(account => <MenuItem key={account.id} disabled={busy || account.id === user?.id} onClick={() => void selectAccount(account)}>
        <ListItemIcon><Avatar src={account.avatar} alt={account.name} sx={{ width: 32, height: 32 }}>{account.name[0]}</Avatar></ListItemIcon>
        <ListItemText primary={account.name} secondary={`@${account.username}`} slotProps={{ primary: { noWrap: true }, secondary: { noWrap: true } }} />
        {account.id === user?.id && <CheckIcon fontSize="small" aria-label="Current account" />}
      </MenuItem>)}
      <MenuItem disabled={busy} onClick={() => { setMessage(""); setLogin({ username: "" }); }}>
        <ListItemIcon><AddIcon /></ListItemIcon><ListItemText primary="Add another account" />
      </MenuItem>
    </MenuList>
    {message && <Alert severity="error" sx={{ mx: 1 }} role="alert">{message}</Alert>}
    {error && <Alert severity="error" sx={{ mx: 1 }} action={<Button color="inherit" size="small" disabled={isLoading} onClick={() => void mutate().catch(() => {})}>Retry</Button>}>Unable to load saved accounts.</Alert>}
    <Divider />
    <Box sx={{ p: 2 }}><Button fullWidth variant="outlined" disabled={busy} onClick={() => void logout()}>Sign out of this account</Button></Box>
    <Dialog open={login !== null} onClose={() => setLogin(null)} maxWidth="xs" fullWidth aria-label="Log in to another account">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Add or switch account<IconButton aria-label="Close account login" onClick={() => setLogin(null)}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent><AuthForm key={login?.username ?? "closed"} initialMode="signin" initialEmail={login?.username} /></DialogContent>
    </Dialog>
  </Stack>;
}
