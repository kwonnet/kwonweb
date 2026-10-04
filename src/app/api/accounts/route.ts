import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { auth } from "@/auth";
import { authOrigin } from "@/lib/auth-redirect";
import { ACCOUNT_LIMIT, ACCOUNT_MAX_AGE, LOGOUT_COOKIE, authCookieNames, sameOriginMutation } from "@/lib/account-session-policy";
import { accountCookieName, accountCookiePrefix, accountProfile, encodeAccount, readSavedAccounts } from "@/lib/saved-accounts";

export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const secureFor = (request: Request) => new URL(authOrigin(request.url)).protocol === "https:";
const options = (secure: boolean) => ({ httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: ACCOUNT_MAX_AGE });

export async function GET(request: NextRequest) {
  const session = await auth();
  const accounts = await readSavedAccounts(request.cookies, secureFor(request));
  return json(accounts.map(account => ({ ...accountProfile(account), active: account.id === session?.user?.id })));
}

export async function POST(request: NextRequest) {
  if (!sameOriginMutation(request, authOrigin(request.url))) return json({ error: "Invalid request origin" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid request" }, 400);
  const secure = secureFor(request);
  const accounts = await readSavedAccounts(request.cookies, secure);

  if (body.action === "logout") {
    // Decode only: logout must work even when the backend or token refresh is down.
    const cookieName = secure ? "__Secure-authjs.session-token" : "authjs.session-token";
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET, cookieName, salt: cookieName });
    const id = (token?.user as { id?: string } | undefined)?.id;
    const response = json({ ok: true });
    response.cookies.set(LOGOUT_COOKIE, String(Date.now()), options(secure));
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith(accountCookiePrefix(secure)) && (!id || cookie.name === accountCookieName(id, secure))) {
        response.cookies.set(cookie.name, "", { ...options(secure), maxAge: 0 });
      }
    }
    // Clear current, chunked and pre-upgrade cookies, including parent-domain cookies.
    const host = new URL(authOrigin(request.url)).hostname;
    const domains = host.includes(".") && !/^[\d.]+$/.test(host) ? [host, ...host.split(".").slice(1, -1).map((_, index) => host.split(".").slice(index + 1).join("."))] : [];
    for (const name of authCookieNames(request.cookies.getAll().map(cookie => cookie.name))) {
      const base = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secure || name.startsWith("__Secure-") || name.startsWith("__Host-") ? "; Secure" : ""}`;
      response.headers.append("Set-Cookie", base);
      if (!name.startsWith("__Host-")) for (const domain of domains) response.headers.append("Set-Cookie", `${base}; Domain=${domain}`);
    }
    return response;
  }

  if (body.action === "remove" && typeof body.accountId === "string") {
    const response = json({ ok: true });
    response.cookies.set(accountCookieName(body.accountId, secure), "", { ...options(secure), maxAge: 0 });
    return response;
  }
  if (body.action !== "remember") return json({ error: "Invalid action" }, 400);
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.accessToken) return json({ error: "Please log in" }, 401);
  const account = { id: user.id, name: user.name, username: user.username, avatar: user.avatar || user.image, accessToken: user.accessToken, savedAt: Date.now() };
  try {
    const response = json({ ok: true });
    response.cookies.set(accountCookieName(user.id, secure), await encodeAccount(account, secure), options(secure));
    const others = accounts.filter(account => account.id !== user.id);
    for (const removed of others.slice(ACCOUNT_LIMIT - 1)) response.cookies.set(accountCookieName(removed.id, secure), "", { ...options(secure), maxAge: 0 });
    return response;
  } catch { return json({ error: "Unable to save this account on this device" }, 500); }
}
