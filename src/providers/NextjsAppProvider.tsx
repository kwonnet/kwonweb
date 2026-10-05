"use client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import type { Session } from "next-auth";
import type { ReactNode } from "react";
import { NotificationsProvider } from "./NotificationsProvider";
import theme from "./theme";
import { SWRConfig } from "swr";

const readCacheOptions = { dedupingInterval: 30_000, focusThrottleInterval: 30_000 };

export default function NextjsAppProvider({ children }: { children: ReactNode; session?: Session | null }) {
  return <>
    <InitColorSchemeScript attribute="data-toolpad-color-scheme" defaultMode="system" />
    <ThemeProvider theme={theme} defaultMode="system" disableTransitionOnChange>
      <CssBaseline />
      <SWRConfig value={readCacheOptions}><NotificationsProvider>{children}</NotificationsProvider></SWRConfig>
    </ThemeProvider>
  </>;
}
