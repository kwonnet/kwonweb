import { NextResponse } from 'next/server';
import { auth } from './auth'; // import it but call manually

export async function proxy(request: any) {
  const { pathname } = request.nextUrl;

  // Allow public access to embed pages
  if (pathname.includes("/embed/")) {
    return NextResponse.next();
  }

  // Otherwise, run your existing auth middleware
  return auth(request);
}

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|static/|favicon.ico|site.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif)$).*)'],
};
