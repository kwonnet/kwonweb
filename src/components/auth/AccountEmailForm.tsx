'use client';
import PasswordTextField from '@/components/common/PasswordTextField';
import {useEffect, useState, type FormEvent} from 'react';
import {Alert, Button, Container, Paper, Stack, TextField, Typography} from '@mui/material';
import Link from 'next/link';
import {requestAccountEmail} from '@/lib/auth';
export default function AccountEmailForm({mode}: {mode: 'verify-email' | 'reset-password'}) {
 const [token,setToken]=useState(''), [email,setEmail]=useState(''), [password,setPassword]=useState(''), [confirm,setConfirm]=useState('');
 const [busy,setBusy]=useState(false), [message,setMessage]=useState(''), [error,setError]=useState(false), [done,setDone]=useState(false);
 useEffect(()=>{const params=new URLSearchParams(window.location.hash.slice(1));setToken(params.get('token') || '');window.history.replaceState(null,'',window.location.pathname);},[]);
 const verify=mode==='verify-email';
 async function submit(event:FormEvent) {
  event.preventDefault();if(busy)return;
  setBusy(true);setMessage('');setError(false);
  try {
   if(token&&!verify&&password!==confirm)throw new Error('Passwords do not match.');
   const action=token?mode:verify?'resend-verification':'forgot-password';
   const result=await requestAccountEmail(action,token?{token,...(!verify?{newPassword:password}:{})}:{email});
   setMessage(result.message);setDone(true);
  }catch(err){setError(true);setMessage(err instanceof Error?err.message:'Unable to process this request.');}finally{setBusy(false);}
 }
 return <Container maxWidth="sm" sx={{py:6}}><Paper variant="outlined" sx={{p:{xs:3,sm:4}}}><Stack component="form" onSubmit={submit} spacing={2}>
 <Typography component="h1" variant="h5">{verify?'Verify your email':'Reset your password'}</Typography>
 <Typography color="text.secondary">{token?verify?'Confirm your email address to start using Kwonnet.':'Choose a new password. Your existing sessions will be signed out.':verify?'Enter your email to request a new verification link.':'Enter your email to receive a password reset link. Accounts without a password should use their sign-up provider.'}</Typography>
 {message&&<Alert severity={error?'error':'success'}>{message}</Alert>}
 {!done&&<>{!token&&<TextField label="Email" type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} required/>}
 {token&&!verify&&<><PasswordTextField label="New password" autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} slotProps={{htmlInput:{minLength:8,maxLength:32}}} required/><PasswordTextField label="Confirm password" autoComplete="new-password" value={confirm} onChange={event=>setConfirm(event.target.value)} required/></>}
 <Button type="submit" variant="contained" loading={busy} disabled={busy}>{token?verify?'Verify email':'Reset password':'Send email'}</Button></>}
 {error&&token&&<Button component={Link} href={verify?'/auth/verify-email':'/auth/reset-password'} onClick={()=>{setToken('');setMessage('');setDone(false);}}>Request a new link</Button>}
 <Button component={Link} href="/auth/signin">Back to sign in</Button>
 </Stack></Paper></Container>;
}
