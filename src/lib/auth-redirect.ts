// Keep environment lookup dynamic: Next.js otherwise embeds NEXT_PUBLIC values
// during the build, which can differ from the deployed container's origin.
function runtimeEnv(name: string): string | undefined { return process.env[name]; }

/** Use the deployed public origin rather than Docker's listening address. */
export function authOrigin(fallback: string): string {
  return new URL(runtimeEnv("NEXT_PUBLIC_APP_URL") || fallback).origin;
}

/** Auth.js expects AUTH_URL internally; derive it from our single public setting. */
export function configureAuthOrigin(): void {
  const origin = runtimeEnv("NEXT_PUBLIC_APP_URL");
  if (origin) process.env.AUTH_URL = authOrigin(origin);
}

/** Callback URLs are untrusted input, including old callback cookies. */
export function safeAuthRedirect(value: string | null, origin: string): string {
  const base = new URL(origin).origin;
  try {
    const target = new URL(value || "/", base);
    if (target.origin === base && !target.username && !target.password &&
        target.pathname !== "/auth/signin" && !target.searchParams.has("refId")) {
      return target.href;
    }
  } catch {
    // Invalid and cross-origin callbacks return to the public homepage.
  }
  return `${base}/`;
}

export function signInRedirect(requestUrl: string): string {
  const requested = new URL(requestUrl);
  const target = new URL("/auth/signin", authOrigin(requestUrl));
  target.searchParams.set("callbackUrl", `${requested.pathname}${requested.search}`);
  return target.href;
}


export const PUBLIC_LEGAL_HEADER = "x-kwonnet-public-legal";
export function isPublicLegalPath(pathname: string): boolean {
  return ["/privacy-policy", "/terms-of-service"].includes(pathname.replace(/\/$/, ""));
}

/** The page renders an authoritative public-only post preview for guests. */
export function isPublicPostPath(pathname: string): boolean {
  return /^\/[^/]+\/feed\/[^/]+\/?$/.test(pathname);
}
