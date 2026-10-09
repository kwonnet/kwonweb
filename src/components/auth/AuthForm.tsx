"use client";
import PasswordTextField from "@/components/common/PasswordTextField";
import { useState, useEffect, type FormEvent } from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { signIn, getProviders } from "next-auth/react";
import Link from "next/link";
import { safeAuthRedirect } from "@/lib/auth-redirect";
import {registerCredentialAccount, requestAccountEmail} from '@/lib/auth';

import { publicEnv } from '@/config/public-env';

export default function AuthForm({ initialMode = "signin", initialEmail = "" }: { initialMode?: "signin" | "signup"; initialEmail?: string }) {
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const registrationEnabled = publicEnv("NEXT_PUBLIC_REGISTRATION_ENABLED") === "true";
  const isSignIn = !registrationEnabled || mode === "signin";
  const [googleEnabled, setGoogleEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    if (typeof getProviders === "function") void getProviders().then(providers => { if (active) setGoogleEnabled(!!providers?.google); }).catch(() => {});
    return () => { active = false; };
  }, []);
  async function googleSignIn() {
    if (loading) return;
    setLoading(true); setMessage(""); setVerificationRequired(false);
    try {
      const location = new URL(window.location.href);
      await signIn("google", {redirectTo: safeAuthRedirect(location.searchParams.get("callbackUrl"), location.origin)});
    } catch { setMessage("Unable to sign in with Google. Please try again."); setLoading(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");
    setSuccess(false);
    setVerificationRequired(false);
    try {
      const location = new URL(window.location.href);
      const redirectTo = safeAuthRedirect(location.searchParams.get("callbackUrl"), location.origin);
      if (!isSignIn) {
        const result = await registerCredentialAccount({name, email, password, refId: location.searchParams.get('refId')});
        setMessage(result.message);setSuccess(true);setPassword('');setMode('signin');return;
      }
      const result = await signIn("credentials-in", {
        email, password,
        redirectTo, redirect: false,
      });
      if (!result || result.error) {
        setVerificationRequired(!!result?.code?.includes('Verify your email before signing in.'));
        setMessage(result?.code || "Unable to sign in. Please check your details and try again.");
        return;
      }
      // The successful auth callback already saves and activates this account.
      // Refresh server-rendered session and personalized data together after authentication.
      window.location.assign(redirectTo);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <Box component="form" onSubmit={submit}>
    <Stack spacing={2}>
      <Typography id="guest-auth-title" component="h2" variant="h5" sx={{ fontWeight: 700 }}>
        {isSignIn ? "Welcome back to Kwonnet" : "Join the conversation"}
      </Typography>
      <Typography id="guest-auth-description" color="text.secondary">
        {registrationEnabled ? "Sign up or log in to keep exploring, share posts, and connect with people." : "Log in to keep exploring, share posts, and connect with people."}
      </Typography>
      {!registrationEnabled && <Alert severity="info">New registrations are temporarily disabled. Existing users can still sign in.</Alert>}
      {message && <Alert severity={success ? 'success' : 'error'} role="alert">{message}</Alert>}
      {!isSignIn && <TextField label="Name" name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required fullWidth disabled={loading} />}
      <TextField label={isSignIn ? "Email or username" : "Email"} name="email" type={isSignIn ? "text" : "email"}
        autoComplete={isSignIn ? "username" : "email"} value={email} onChange={e => {setEmail(e.target.value);setVerificationRequired(false);}} required fullWidth disabled={loading} />
      <PasswordTextField label="Password" name="password" autoComplete={isSignIn ? "current-password" : "new-password"}
        value={password} onChange={e => setPassword(e.target.value)} required fullWidth disabled={loading} />
      <Button type="submit" variant="contained" size="large" loading={loading} disabled={loading}>
        {isSignIn ? "Log in" : "Create account"}
      </Button>
      {isSignIn && <><Button component={Link} href="/auth/reset-password" disabled={loading}>Forgot password?</Button>
      {verificationRequired && <Button type="button" disabled={loading || !email} onClick={async () => {
        setLoading(true);setSuccess(false);
        try {const result=await requestAccountEmail('resend-verification',{email});setMessage(result.message);setSuccess(true);}
        catch(error){setMessage(error instanceof Error?error.message:'Unable to send verification email.');}
        finally{setLoading(false);}
      }}>Resend verification email</Button>}</>}
      {registrationEnabled && <Button type="button" disabled={loading} onClick={() => { setMode(isSignIn ? "signup" : "signin"); setMessage(""); setVerificationRequired(false); }}>
        {isSignIn ? "New to Kwonnet? Sign up" : "Already have an account? Log in"}
      </Button>}
      {googleEnabled && <Button type="button" variant="outlined" size="large" disabled={loading} onClick={googleSignIn}>
        Continue with Google
      </Button>}
      <Typography variant="caption" color="text.secondary" data-guest-auth-ignore>
        By continuing, you agree to our <Link href="/terms-of-service">Terms of Service</Link> and acknowledge our <Link href="/privacy-policy">Privacy Policy</Link>.
      </Typography>
    </Stack>
  </Box>;
}
