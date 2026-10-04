"use client";
import { useRef, useState } from 'react';
import { Cropper, CircleStencil, type CropperRef } from 'react-advanced-cropper';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import 'react-advanced-cropper/dist/style.css';

export default function ProfileImageCropper({ source, kind, onClose, onSave }: {
  source: string; kind: 'avatar' | 'banner'; onClose: () => void; onSave: (file: File) => Promise<void>;
}) {
  const ref = useRef<CropperRef>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function crop() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const canvas = ref.current?.getCanvas({ width: kind === 'avatar' ? 512 : 1500, height: kind === 'avatar' ? 512 : 500 });
      if (!canvas) throw new Error('The image is not ready. Please try again.');
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Unable to crop this image.')), 'image/jpeg', 0.9));
      await onSave(new File([blob], `${kind}.jpg`, { type: 'image/jpeg' }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to upload image.'); }
    finally { setBusy(false); }
  }
  return <Dialog open fullWidth maxWidth="sm" onClose={busy ? undefined : onClose} aria-labelledby="profile-crop-title">
    <DialogTitle id="profile-crop-title">Crop {kind === 'avatar' ? 'profile picture' : 'banner'}</DialogTitle>
    <DialogContent>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Cropper ref={ref} src={source} stencilComponent={kind === 'avatar' ? CircleStencil : undefined}
        stencilProps={{ aspectRatio: kind === 'avatar' ? 1 : 3 }} style={{ height: 360 }} />
    </DialogContent>
    <DialogActions><Button disabled={busy} onClick={onClose}>Cancel</Button><Button variant="contained" loading={busy} onClick={() => void crop()}>Use image</Button></DialogActions>
  </Dialog>;
}
