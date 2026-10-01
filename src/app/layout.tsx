import { publicEnvScript } from "@/config/public-env";
import type { Metadata } from "next";
import LinearProgress from "@mui/material/LinearProgress";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { SessionProvider } from "next-auth/react";
import React from "react";
import { auth } from "@/auth";
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
  const session = await auth();
  return (
    <html lang="en" data-toolpad-color-scheme="system" suppressHydrationWarning>
      <head>
        <script id="kwonnet-public-env" dangerouslySetInnerHTML={{ __html: publicEnvScript() }} />
      </head>
      <body>
        <SessionProvider session={session}>
          <AppRouterCacheProvider>
            <React.Suspense fallback={<LinearProgress />}>
              <NextjsAppProvider session={session}>
                <RegisterDeviceProvider>
                <SocketIoProvider>
                    <SSEContextProvider>{children}</SSEContextProvider>
                </SocketIoProvider>
                </RegisterDeviceProvider>
              </NextjsAppProvider>
            </React.Suspense>
          </AppRouterCacheProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
