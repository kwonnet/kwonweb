import { NextRequest, NextResponse, type NextFetchEvent } from 'next/server';
import { isPublicLegalPath, PUBLIC_LEGAL_HEADER } from './lib/auth-redirect';
import { auth } from './auth'; // import it but call manually

const authenticatedProxy = auth((_request: NextRequest, _event: NextFetchEvent) => NextResponse.next());

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // Only the proxy may mark legal routes as independent of authentication.
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.delete(PUBLIC_LEGAL_HEADER);
  if (isPublicLegalPath(pathname)) {
    forwardedHeaders.set(PUBLIC_LEGAL_HEADER, "1");
    return NextResponse.next({request: {headers: forwardedHeaders}});
  }
  request = new NextRequest(request, {headers: forwardedHeaders});

  // Allow public access to embed pages
  if (pathname.includes("/embed/")) {
    return NextResponse.next({request: {headers: forwardedHeaders}});
  }

  // Otherwise, run your existing auth middleware
  const response = await authenticatedProxy(request, event);
  if (response instanceof Response && response.headers.get("x-middleware-next") === "1") {
    const forwarding = NextResponse.next({request: {headers: forwardedHeaders}});
    for (const [name, value] of forwarding.headers) {
      if (name === "x-middleware-override-headers" || name.startsWith("x-middleware-request-")) response.headers.set(name, value);
    }
  }
  return response;
}

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|static/|favicon.ico|site.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif)$).*)'],
};
