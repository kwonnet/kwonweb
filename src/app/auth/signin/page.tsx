"use client";
import * as React from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  FormHelperText,
  Paper,
  Stack,
} from "@mui/material";
import { signIn } from "next-auth/react";
import { safeAuthRedirect } from "@/lib/auth-redirect";

const page = () => {
  // eslint-disable-next-line
  const [state, setState] = React.useState({
    loading: false,
    isSignIn: true,
    message: "",
    name: "",
    email: "",
    password: "",
  });

  // const router = useRouter();

  // const [showPassword, setShowPassword] = React.useState(false);

  // const handleClickShowPassword = () => setShowPassword((show) => !show);

  // const handleMouseDownPassword = (
  //   event: React.MouseEvent<HTMLButtonElement>
  // ) => {
  //   event.preventDefault();
  // };

  // const handleMouseUpPassword = (
  //   event: React.MouseEvent<HTMLButtonElement>
  // ) => {
  //   event.preventDefault();
  // };

  const toggleSignIn = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, isSignIn: !prev.isSignIn }));
  };

  const handleSubmit = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.preventDefault();
    try {
      const urlInfo = new URL(window.location.href)
      const callbackUrl = urlInfo.searchParams.get("callbackUrl")
      const refId = urlInfo.searchParams.get("refId")
      const redirectUrl = safeAuthRedirect(callbackUrl, urlInfo.origin)
      setState((prev) => ({ ...prev, message: "", loading: true }));
      const res = await signIn(state.isSignIn ? "credentials-in" : "credentials-up", state.isSignIn ? {
        email: state.email,
        password: state.password,
        redirectTo: redirectUrl,
        redirect: false,
      } : {
        name: state.name,
        email: state.email,
        password: state.password,
        refId,
        redirectTo: redirectUrl,
        redirect: false,
      });
      if (res?.error) {
        setState((prev) => ({ ...prev, message: res.code as string }));
        return;
      }
      window.location.href = redirectUrl
    } catch (error: any) {
      setState((prev) => ({ ...prev, message: error?.message }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        sx={{
          p: 2,
          width: 320,
          margin: "0 auto",
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "100%",
          }}
        >
          <Typography variant="h5" component="h2" gutterBottom>
          {state.isSignIn ? "Sign In" : "Sign Up"}
          </Typography>
          {!state.isSignIn && <FormControl fullWidth sx={{ my: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={state.name}
              name="name"
              type="text"
              placeholder="Full name"
              onChange={(e) =>
                setState((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </FormControl>}
          <FormControl fullWidth sx={{ my: 1 }}>
            <TextField
              fullWidth
              label={state.isSignIn ? "Username" : "Email"}
              value={state.email}
              name="email"
              type={state.isSignIn ? "text" : "email"}
              placeholder={state.isSignIn ? "Email or Username" : "Email Address"}
              onChange={(e) =>
                setState((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </FormControl>
          <FormControl fullWidth sx={{ my: 1 }}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={state.password}
              onChange={(e) =>
                setState((prev) => ({ ...prev, password: e.target.value }))
              }
              required
            />
            {state.message && (
              <FormHelperText
                sx={{ color: (theme) => theme.vars.palette.error.light }}
              >
                {state.message}
              </FormHelperText>
            )}
            <Button
              loading={state.loading}
              disabled={state.loading}
              variant="contained"
              onClick={(ev) => handleSubmit(ev)}
              sx={{ mt: 2 }}
            >
              {state.isSignIn ? "Sign In" : "Sign Up"}
            </Button>
          </FormControl>
          <Box>
            <Stack direction={"row"} spacing={1} sx={{
              alignItems: "center"
            }}>
              <Typography> { state.isSignIn ? "Don't have an account?" : "Already have an account?"} </Typography>
              <Button size="small" onClick={ev => toggleSignIn(ev)}>
                {state.isSignIn ? "Sign Up" : "Sign in"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default page;
