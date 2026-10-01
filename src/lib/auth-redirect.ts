/** Use the deployed public origin rather than Docker's listening address. */
export function authOrigin(fallback: string): string {
  const key = "NEXT_PUBLIC_APP_URL";
  return new URL(process.env[key] || fallback).origin;
}

/** Auth.js expects AUTH_URL internally; derive it from our single public setting. */
export function configureAuthOrigin(): void {
  const key = "NEXT_PUBLIC_APP_URL";
  if (process.env[key]) process.env.AUTH_URL = authOrigin(process.env[key]!);
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
