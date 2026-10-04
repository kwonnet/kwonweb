"use client";
import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { signIn } from "next-auth/react";
import { safeAuthRedirect } from "@/lib/auth-redirect";

export default function AuthForm({ initialMode = "signup" }: { initialMode?: "signin" | "signup" }) {
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSignIn = mode === "signin";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");
    try {
      const location = new URL(window.location.href);
      const redirectTo = safeAuthRedirect(location.searchParams.get("callbackUrl"), location.origin);
      const result = await signIn(isSignIn ? "credentials-in" : "credentials-up", {
        email, password, ...(isSignIn ? {} : { name, refId: location.searchParams.get("refId") }),
        redirectTo, redirect: false,
      });
      if (!result || result.error) {
        setMessage(result?.code || "Unable to sign in. Please check your details and try again.");
        return;
      }
      // Refresh server-rendered session and personalized data together after authentication.
      window.location.assign(redirectTo);
    } catch {
      setMessage("Unable to connect. Please try again.");
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
        Sign up or log in to keep exploring, share posts, and connect with people.
      </Typography>
      {message && <Alert severity="error" role="alert">{message}</Alert>}
      {!isSignIn && <TextField label="Name" name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required fullWidth disabled={loading} />}
      <TextField label={isSignIn ? "Email or username" : "Email"} name="email" type={isSignIn ? "text" : "email"}
        autoComplete={isSignIn ? "username" : "email"} value={email} onChange={e => setEmail(e.target.value)} required fullWidth disabled={loading} />
      <TextField label="Password" name="password" type="password" autoComplete={isSignIn ? "current-password" : "new-password"}
        value={password} onChange={e => setPassword(e.target.value)} required fullWidth disabled={loading} />
      <Button type="submit" variant="contained" size="large" loading={loading} disabled={loading}>
        {isSignIn ? "Log in" : "Create account"}
      </Button>
      <Button type="button" disabled={loading} onClick={() => { setMode(isSignIn ? "signup" : "signin"); setMessage(""); }}>
        {isSignIn ? "New to Kwonnet? Sign up" : "Already have an account? Log in"}
      </Button>
    </Stack>
  </Box>;
}
