'use client';
import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import AddToHomeScreen from '@mui/icons-material/AddToHomeScreen';
import { usePwaInstall } from '@/providers/PwaProvider';

export default function PwaInstallButton() {
  const { canInstall, ios, install } = usePwaInstall();
  const [instructions, setInstructions] = useState(false), [busy, setBusy] = useState(false);
  if (!canInstall) return null;
  return <>
    <Button startIcon={<AddToHomeScreen />} disabled={busy} sx={{ minHeight: 44, mb: 1 }} onClick={async () => {
      if (ios) { setInstructions(true); return; }
      setBusy(true);
      try { await install(); } catch { console.warn('Kwonnet installation prompt could not be opened.'); }
      finally { setBusy(false); }
    }}>Install Kwonnet</Button>
    <Dialog open={instructions} onClose={() => setInstructions(false)} aria-labelledby="pwa-install-title">
      <DialogTitle id="pwa-install-title">Install Kwonnet</DialogTitle>
      <DialogContent><Typography>Open Kwonnet in Safari, tap Share, then choose Add to Home Screen. Open the installed app from your Home Screen.</Typography></DialogContent>
      <DialogActions><Button onClick={() => setInstructions(false)}>Done</Button></DialogActions>
    </Dialog>
  </>;
}
