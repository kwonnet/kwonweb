"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { useSession } from 'next-auth/react';
import { Alert, Autocomplete, Avatar, Box, Button, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/common/PageHeader';
import { updateProfileCache } from '@/utils/profile-cache';
import { saveProfile } from '@/lib/profile-actions';
import { uploadMultipleFilesWithMetadata } from '@/utils/r2-upload';
import type { EditableProfile, ProfileChanges, ProfileEditData } from '@/types/profile';
const ProfileImageCropper = dynamic(() => import('./ProfileImageCropper'), { ssr: false });
const fields = ['name', 'username', 'bio', 'phone', 'website', 'avatar', 'banner', 'countryId', 'dateOfBirth'] as const;

export default function ProfileEditor({ initial }: { initial: ProfileEditData }) {
  const { update } = useSession();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  async function refreshIdentity(saved: EditableProfile) {
    await mutate(() => true, (cached: unknown) => updateProfileCache(cached, saved), { revalidate: false });
    const session = await update({ refreshIdentity: true });
    if (!session?.user) throw new Error("Account refresh failed");
    const response = await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remember' }), signal: AbortSignal.timeout(8_000) });
    if (response.ok) await mutate(key => Array.isArray(key) && key[0] === '/api/accounts');
    router.refresh();
  }
  const [profile, setProfile] = useState(initial.profile);
  const [savedProfile, setSavedProfile] = useState(initial.profile);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer); }, []);
  const [error, setError] = useState('');
  const [crop, setCrop] = useState<{ kind: 'avatar' | 'banner'; source: string } | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null), bannerInput = useRef<HTMLInputElement>(null);
  useEffect(() => { return () => { if (crop) URL.revokeObjectURL(crop.source); }; }, [crop]);
  const countryLocked = !!profile.countryNextChangeAt && new Date(profile.countryNextChangeAt).getTime() > now;
  const birthLocked = !!profile.dateOfBirthNextChangeAt && new Date(profile.dateOfBirthNextChangeAt).getTime() > now;
  const helper = (next: string | null, locked: boolean) => locked ? `Available again ${new Date(next!).toLocaleDateString()}` : 'Can be changed once every 30 days.';
  function change<K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) { setProfile(p => ({ ...p, [key]: value })); }
  function chooseImage(kind: 'avatar' | 'banner', file?: File) {
    setError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 10 * 1024 * 1024) { setError('Choose a JPEG, PNG, WebP or AVIF image up to 10 MB.'); return; }
    setCrop({ kind, source: URL.createObjectURL(file) });
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || crop) return;
    const changes: ProfileChanges = {};
    for (const key of fields) if (profile[key] !== savedProfile[key]) changes[key] = profile[key] as never;
    if (!Object.keys(changes).length) { setError('There are no changes to save.'); return; }
    setBusy(true); setError('');
    let result: Awaited<ReturnType<typeof saveProfile>>;
    try { result = await saveProfile(changes); }
    catch { setError("Unable to save your profile. Please try again."); setBusy(false); return; }
    if (result.error || !result.profile) { setError(result.error || 'Unable to save profile.'); setBusy(false); return; }
    // Refresh the authenticated identity from the backend, never from form data.
    try {
      await refreshIdentity(result.profile);
    } catch { /* Full document navigation also refreshes server data. */ }
    window.location.replace(`/@${result.profile.username}`);
  }
  return <Box sx={{ maxWidth: 800, mx: 'auto', pb: 4 }}>
    <PageHeader title="Edit profile" />
    <Paper component="form" onSubmit={e => void submit(e)} elevation={0} sx={{ overflow: 'hidden', borderRadius: 2 }}>
      <Box sx={{ position: 'relative', height: { xs: 180, sm: 260 }, bgcolor: 'action.hover', overflow: 'hidden' }}>
        {profile.banner && <Box component="img" src={profile.banner} alt="Profile banner" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <Tooltip title="Update banner"><IconButton aria-label="Update banner" disabled={busy} onClick={() => bannerInput.current?.click()} sx={{ position: 'absolute', right: 16, bottom: 16, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}><CameraAltIcon /></IconButton></Tooltip>
      </Box>
      <Box sx={{ position: 'relative', mx: { xs: 2, sm: 3 }, height: { xs: 72, sm: 88 } }}>
        <Box sx={{ position: 'absolute', top: { xs: -56, sm: -72 } }}>
          <Avatar src={profile.avatar || undefined} alt={profile.name} sx={{ width: { xs: 120, sm: 152 }, height: { xs: 120, sm: 152 }, border: '4px solid', borderColor: 'background.paper' }} />
          <Tooltip title="Update profile picture"><IconButton aria-label="Update profile picture" disabled={busy} onClick={() => avatarInput.current?.click()} sx={{ position: 'absolute', right: 0, bottom: 4, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}><CameraAltIcon /></IconButton></Tooltip>
        </Box>
      </Box>
      <input ref={avatarInput} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e => { chooseImage('avatar', e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={bannerInput} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e => { chooseImage('banner', e.target.files?.[0]); e.target.value = ''; }} />
      <Stack spacing={2.5} sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 3 }}>
        <Typography color="text.secondary">Update your public profile. Email and password are managed separately.</Typography>
        {error && <Alert severity="error" role="alert">{error}</Alert>}
        <TextField label="Name" required value={profile.name} disabled={busy} onChange={e => change('name', e.target.value)} slotProps={{ htmlInput: { minLength: 2, maxLength: 80 } }} />
        <TextField label="Username" required value={profile.username} disabled={busy} onChange={e => change('username', e.target.value)} helperText="3–30 letters, numbers or underscores. Changing this also changes your profile link." slotProps={{ htmlInput: { pattern: '[a-zA-Z0-9_]{3,30}', maxLength: 30 } }} />
        <TextField label="Bio" multiline minRows={3} value={profile.bio || ''} disabled={busy} onChange={e => change('bio', e.target.value)} helperText={`${profile.bio?.length || 0}/160`} slotProps={{ htmlInput: { maxLength: 160 } }} />
        <TextField label="Website" type="url" value={profile.website || ''} disabled={busy} onChange={e => change('website', e.target.value)} slotProps={{ htmlInput: { maxLength: 2048 } }} />
        <TextField label="Phone number" type="tel" value={profile.phone || ''} disabled={busy} onChange={e => change('phone', e.target.value)} helperText="Not displayed on your public profile." slotProps={{ htmlInput: { maxLength: 25 } }} />
        <Autocomplete options={initial.countries} value={initial.countries.find(c => c.id === profile.countryId) || null} disabled={busy || countryLocked}
          getOptionLabel={c => c.name} isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_, country) => change('countryId', country?.id ?? null)}
          renderInput={params => <TextField {...params} label="Country" helperText={helper(profile.countryNextChangeAt, countryLocked)} />} />
        <TextField label="Date of birth" type="date" value={profile.dateOfBirth || ''} disabled={busy || birthLocked} onChange={e => change('dateOfBirth', e.target.value || null)}
          helperText={`${helper(profile.dateOfBirthNextChangeAt, birthLocked)} Not displayed publicly.`} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: '1900-01-01', max: new Date(now).toISOString().slice(0, 10) } }} />
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}><Button component={Link} href={`/@${initial.profile.username}`} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" loading={busy} disabled={!!crop}>Save changes</Button></Stack>
      </Stack>
    </Paper>
    {crop && <ProfileImageCropper kind={crop.kind} source={crop.source} onClose={() => setCrop(null)} onSave={async file => {
      const kind = crop.kind;
      setBusy(true);
      try {
        const [uploaded] = await uploadMultipleFilesWithMetadata([{ file, flags: [], folder: kind === "avatar" ? "profiles" : "banners" }]);
        const result = await saveProfile({ [kind]: uploaded.url });
        if (result.error || !result.profile) throw new Error(result.error || 'Unable to save profile image.');
        change(kind, result.profile[kind]);
        setSavedProfile(previous => ({ ...previous, [kind]: result.profile![kind] }));
        setCrop(null);
        try {
          await refreshIdentity(result.profile);
        } catch { setError('Image saved, but account refresh failed. Please refresh the page.'); }

      } finally { setBusy(false); }
    }} />}
  </Box>;
}
