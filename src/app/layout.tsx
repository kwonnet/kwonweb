import {siteOrigin} from '@/lib/seo';
import AuthSessionBoundary from "@/providers/AuthSessionBoundary";
import { headers } from "next/headers";
import { PUBLIC_LEGAL_HEADER } from "@/lib/auth-redirect";
import { publicEnvScript } from "@/config/public-env";
import type { Metadata } from "next";
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
import ConvoSocketIoProvider from "@/context/ConvoSocketIoContext";
import SocketIoProvider from "@/context/SocketIoContext";
import { constant } from "@/config";
import SSEContextProvider from "@/context/SSEContext";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {default: constant.siteName, template: '%s | Kwonnet'},
  applicationName: 'Kwonnet',
  verification: {google: process.env.GOOGLE_SITE_VERIFICATION, other: process.env.BING_SITE_VERIFICATION ? {'msvalidate.01': process.env.BING_SITE_VERIFICATION} : undefined},
  robots: {index: false, follow: false},
  openGraph: {siteName: 'Kwonnet', type: 'website', title: 'Kwonnet', description: constant.siteDescription, images: ['/android-chrome-512x512.png']},
  twitter: {card: 'summary_large_image', title: 'Kwonnet', description: constant.siteDescription, images: ['/android-chrome-512x512.png']},
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

              <NextjsAppProvider session={session}>
                {publicLegal ? children : <SocketIoProvider><ConvoSocketIoProvider><SSEContextProvider>
                  <AuthSessionBoundary initiallyAuthenticated={!!session?.user}>{children}</AuthSessionBoundary>
                </SSEContextProvider></ConvoSocketIoProvider></SocketIoProvider>}
              </NextjsAppProvider>

          </AppRouterCacheProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
