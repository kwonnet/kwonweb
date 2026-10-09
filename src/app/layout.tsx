import { pwaStartupImages } from "@/config/pwa-splash";
import { pwaThemeScript } from "@/utils/pwa-theme";
import {siteOrigin} from '@/lib/seo';
import AuthSessionBoundary from "@/providers/AuthSessionBoundary";
import { headers } from "next/headers";
import { PUBLIC_LEGAL_HEADER } from "@/lib/auth-redirect";
import { publicEnvScript } from "@/config/public-env";
import type { Metadata, Viewport } from "next";
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
import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google'

export const dynamic = "force-dynamic";
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1565c0' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {default: constant.siteName, template: '%s | Kwonnet'},
  applicationName: 'Kwonnet',
  appleWebApp: { capable: true, title: 'Kwonnet', statusBarStyle: 'default' },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  verification: {google: process.env.GOOGLE_SITE_VERIFICATION, other: process.env.BING_SITE_VERIFICATION ? {'msvalidate.01': process.env.BING_SITE_VERIFICATION} : undefined},
  robots: {index: false, follow: false},
  openGraph: {siteName: 'Kwonnet', type: 'website', title: 'Kwonnet', description: constant.siteDescription, images: ['/og-image.png']},
  twitter: {card: 'summary_large_image', title: 'Kwonnet', description: constant.siteDescription, images: ['/og-image.png']},
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
        <style id="kwonnet-launch-background">{`html[data-toolpad-color-scheme="system"], html[data-toolpad-color-scheme="system"] body { background-color: #ffffff; } @media (prefers-color-scheme: dark) { html[data-toolpad-color-scheme="system"], html[data-toolpad-color-scheme="system"] body { background-color: #111111; } }`}</style>
        <script id="kwonnet-pwa-theme" dangerouslySetInnerHTML={{ __html: pwaThemeScript }} />
        <link rel="manifest" href="/site.webmanifest" crossOrigin="use-credentials" />
        {pwaStartupImages.map(image => <link key={image.href} rel="apple-touch-startup-image" href={image.href} media={image.media} />)}
        <link rel="describedby" href="/llms.txt" />
        <link rel="ai-catalog" type="application/json" href="/.well-known/ai-catalog.json" />
        <script id="kwonnet-public-env" dangerouslySetInnerHTML={{ __html: publicEnvScript() }} />
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      </head>
      <body>
        <SessionProvider session={session} refetchWhenOffline={false} refetchOnWindowFocus={!publicLegal} refetchInterval={publicLegal ? 0 : 60}>
          <AppRouterCacheProvider>

              <NextjsAppProvider session={session}>
                {publicLegal ? children : <SocketIoProvider><ConvoSocketIoProvider><SSEContextProvider>
                  <AuthSessionBoundary initiallyAuthenticated={!!session?.user}>{children}</AuthSessionBoundary>
                </SSEContextProvider></ConvoSocketIoProvider></SocketIoProvider>}
              </NextjsAppProvider>

          </AppRouterCacheProvider>
        </SessionProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      </body>
    </html>
  );
}
