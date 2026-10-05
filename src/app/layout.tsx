import AuthSessionBoundary from "@/providers/AuthSessionBoundary";
import { headers } from "next/headers";
import { PUBLIC_LEGAL_HEADER } from "@/lib/auth-redirect";
import { publicEnvScript } from "@/config/public-env";
import type { Metadata } from "next";
import AppLoadingShell from "@/components/common/AppLoadingShell";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { SessionProvider } from "next-auth/react";
import React from "react";
import { getServerSession } from "@/lib/server-session";
import NextjsAppProvider from "@/providers/NextjsAppProvider";
// slick slider
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
//  video plyer
// import "@vidstack/react/player/styles/base.css";
// import "@vidstack/react/player/styles/plyr/theme.css";
// global styles
import "./globals.css";
import SocketIoProvider from "@/context/SocketIoContext";
import { constant } from "@/config";
import SSEContextProvider from "@/context/SSEContext";
import RegisterDeviceProvider from "@/providers/RegisterDeviceProvider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: constant.siteName,
  description: constant.siteDescription,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publicLegal = (await headers()).get(PUBLIC_LEGAL_HEADER) === "1";
  const session = publicLegal ? null : await getServerSession();
  return (
    <html lang="en" data-toolpad-color-scheme="system" suppressHydrationWarning>
      <head>
        <script id="kwonnet-public-env" dangerouslySetInnerHTML={{ __html: publicEnvScript() }} />
      </head>
      <body>
        <SessionProvider session={session} refetchOnWindowFocus={!publicLegal} refetchInterval={publicLegal ? 0 : 60}>
          <AppRouterCacheProvider>
            <React.Suspense fallback={<AppLoadingShell />}>
              <NextjsAppProvider session={session}>
                {publicLegal ? children : <AuthSessionBoundary initiallyAuthenticated={!!session?.user}><RegisterDeviceProvider>
                <SocketIoProvider>
                    <SSEContextProvider>{children}</SSEContextProvider>
                </SocketIoProvider>
                </RegisterDeviceProvider></AuthSessionBoundary>}
              </NextjsAppProvider>
            </React.Suspense>
          </AppRouterCacheProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
