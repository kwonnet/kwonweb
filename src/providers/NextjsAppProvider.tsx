"use client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import type { Session } from "next-auth";
import type { ReactNode } from "react";
import { NotificationsProvider } from "./NotificationsProvider";
import theme from "./theme";

export default function NextjsAppProvider({ children }: { children: ReactNode; session?: Session | null }) {
  return <>
    <InitColorSchemeScript attribute="data-toolpad-color-scheme" defaultMode="system" />
    <ThemeProvider theme={theme} defaultMode="system" disableTransitionOnChange>
      <CssBaseline />
      <NotificationsProvider>{children}</NotificationsProvider>
    </ThemeProvider>
  </>;
}
