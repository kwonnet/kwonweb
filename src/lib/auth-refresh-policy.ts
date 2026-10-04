/** Decode only to schedule refresh; the API remains responsible for JWT verification. */
export function shouldRefreshAccessToken(accessToken: unknown, refreshedAt: unknown, now = Date.now()): boolean {
  if (typeof accessToken !== "string") return true;
  try {
    const payload = accessToken.split(".")[1];
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof claims.exp !== "number" || !Number.isFinite(claims.exp) || claims.exp * 1000 <= now + 60_000) return true;
    const lastRefresh = typeof refreshedAt === "number" ? refreshedAt : claims.iat * 1000;
    // Refresh profile data at most every five minutes, or before token expiry.
    return !Number.isFinite(lastRefresh) || lastRefresh > now || now - lastRefresh >= 300_000;
  } catch {
    return true;
  }
}
