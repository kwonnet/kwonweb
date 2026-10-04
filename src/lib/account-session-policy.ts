export const LOGOUT_COOKIE = "kwonnet.logout-at";
export const ACTIVE_SESSION_COOKIE = "kwonnet.active-session";
export const ACCOUNT_LIMIT = 5;
export const ACCOUNT_MAX_AGE = 30 * 24 * 60 * 60;

export function sessionCookieBase(secure: boolean): string {
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

export function activeSessionCookieName(cookieHeader: string | null, secure: boolean): string {
  const base = sessionCookieBase(secure);
  const generation = cookieValue(cookieHeader, ACTIVE_SESSION_COOKIE);
  if (!generation || !/^[0-9a-f-]{36}$/i.test(generation)) return base;
  const name = `${base}-${generation}`;
  // Existing sessions from before generation-specific cookies remain readable.
  return (cookieHeader || "").split(";").some(part => {
    const key = part.trim().split("=")[0];
    return key === name || key.startsWith(`${name}.`);
  }) ? name : base;
}

export function logoutTime(cookieHeader: string | null): number {
  return Math.max(0, ...(cookieHeader || "").split(";").flatMap(part => {
    const [name, value] = part.trim().split("=");
    const time = Number(value);
    return name === LOGOUT_COOKIE && Number.isSafeInteger(time) && time > 0 && time <= Date.now() ? [time] : [];
  }));
}

/** Preserve the original login time across refreshes, including legacy sessions. */
export function sessionLoginTime(token: { sessionIssuedAt?: unknown; iat?: unknown }): number {
  return typeof token.sessionIssuedAt === "number" ? token.sessionIssuedAt : typeof token.iat === "number" ? token.iat * 1000 : 0;
}

export function sessionWasLoggedOut(token: { sessionIssuedAt?: unknown; iat?: unknown }, loggedOutAt: number): boolean {
  return loggedOutAt > 0 && sessionLoginTime(token) <= loggedOutAt;
}

export function cookieValue(cookieHeader: string | null, name: string): string | undefined {
  return (cookieHeader || "").split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export function sameOriginMutation(request: Request, origin: string): boolean {
  return request.headers.get("origin") === new URL(origin).origin && request.headers.get("sec-fetch-site") !== "cross-site";
}

export function authCookieNames(names: string[]): string[] {
  const bases = ["authjs.session-token", "next-auth.session-token", "authjs.callback-url", "next-auth.callback-url", "authjs.csrf-token", "next-auth.csrf-token"];
  const all = bases.flatMap(name => [name, `__Secure-${name}`, `__Host-${name}`]);
  return [...new Set([...all, ...names.filter(name => /^(?:__Secure-|__Host-)?(?:authjs|next-auth)\.session-token(?:-[0-9a-f-]{36})?(?:\.\d+)?$/i.test(name)), "tx_a_t", "x_a_t"])];
}
