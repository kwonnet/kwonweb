import type { Metadata } from "next";
import LinearProgress from "@mui/material/LinearProgress";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { SessionProvider } from "next-auth/react";
import React from "react";
import { auth } from "@/auth";
import NextjsAppProvider from "@/providers/NextjsAppProvider";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./globals.css";
import SocketIoProvider from "@/context/SocketIoContext";
import { constant } from "@/config";
import SSEContextProvider from "@/context/SSEContext";

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider session={session}>
          <AppRouterCacheProvider>
            <React.Suspense fallback={<LinearProgress />}>
              <NextjsAppProvider session={session}>
                <SocketIoProvider>
                  <SSEContextProvider>
                    {children}
                  </SSEContextProvider>
                </SocketIoProvider>
              </NextjsAppProvider>
            </React.Suspense>
          </AppRouterCacheProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
