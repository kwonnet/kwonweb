import type { NextRequest } from 'next/server';
import manifest from '@/config/pwa-manifest.json';
import { pwaSplashColors } from '@/config/pwa-splash';

export const dynamic = 'force-dynamic';
export function GET(request: NextRequest) {
  const dark = request.cookies.get('kwonnet-pwa-theme')?.value === 'dark';
  return Response.json({ ...manifest,
    background_color: dark ? pwaSplashColors.dark : pwaSplashColors.light,
    theme_color: dark ? pwaSplashColors.dark : manifest.theme_color,
  }, { headers: {
    'Content-Type': 'application/manifest+json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Vary': 'Cookie',
  } });
}
