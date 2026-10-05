'use client';
import { useState } from 'react';
import { Box, IconButton, TextField } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useRouter } from 'next/navigation';
import { searchHref } from '@/utils/post-text';
export default function SearchToolbar() {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const submit = () => { if (value.trim()) { router.push(searchHref(value, 'typed_query')); setOpen(false); } };
  return <>
    <IconButton aria-label="Open search" onClick={() => setOpen(!open)} sx={{ display: { xs: 'inline-flex', lg: 'none' } }}><SearchOutlinedIcon /></IconButton>
    <Box component="form" onSubmit={event => { event.preventDefault(); submit(); }} sx={{ display: { xs: open ? 'flex' : 'none', lg: 'flex' }, position: 'absolute', width: { xs: '70%', lg: '50%' }, left: '50%', transform: 'translateX(-50%)', top: 10 }}>
      <TextField fullWidth size="small" label="Search" value={value} onChange={event => setValue(event.target.value)} slotProps={{ htmlInput: { maxLength: 200 }, input: { sx: { borderRadius: 30, bgcolor: 'background.paper' }, endAdornment: <IconButton type="submit" aria-label="Search"><SearchOutlinedIcon /></IconButton> } }} />
    </Box>
  </>;
}
