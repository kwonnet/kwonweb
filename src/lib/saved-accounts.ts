import "server-only";
import { createHash } from "node:crypto";
import { decode, encode } from "next-auth/jwt";
import { ACCOUNT_LIMIT, ACCOUNT_MAX_AGE } from "./account-session-policy";

export type AccountProfile = { id: string; name: string; username: string; avatar?: string; active?: boolean };
export type SavedAccount = AccountProfile & { accessToken: string; savedAt: number };
type CookieReader = { getAll(): { name: string; value: string }[] };

export function accountCookiePrefix(secure: boolean) { return secure ? "__Host-kwonnet.account." : "kwonnet.account."; }
export function accountCookieName(id: string, secure: boolean) {
  return accountCookiePrefix(secure) + createHash("sha256").update(id).digest("hex").slice(0, 24);
}
function secret() {
  if (!process.env.AUTH_SECRET) throw new Error("Authentication is not configured");
  return process.env.AUTH_SECRET;
}
export async function readSavedAccounts(jar: CookieReader, secure: boolean): Promise<SavedAccount[]> {
  const prefix = accountCookiePrefix(secure);
  const accounts = await Promise.all(jar.getAll().filter(cookie => cookie.name.startsWith(prefix)).slice(0, ACCOUNT_LIMIT + 1).map(async cookie => {
    try {
      const data = await decode({ token: cookie.value, secret: secret(), salt: cookie.name });
      const account = data?.account as SavedAccount | undefined;
      if (!account || typeof account.id !== "string" || typeof account.name !== "string" || typeof account.username !== "string" ||
          typeof account.accessToken !== "string" || typeof account.savedAt !== "number" || accountCookieName(account.id, secure) !== cookie.name) return null;
      return account;
    } catch { return null; }
  }));
  return accounts.filter((account): account is SavedAccount => !!account).sort((a, b) => b.savedAt - a.savedAt).slice(0, ACCOUNT_LIMIT);
}
export async function encodeAccount(account: SavedAccount, secure: boolean) {
  const value = await encode({ token: { account }, secret: secret(), salt: accountCookieName(account.id, secure), maxAge: ACCOUNT_MAX_AGE });
  if (value.length > 3800) throw new Error("This account cannot be saved on this device");
  return value;
}
export function accountProfile(account: AccountProfile): AccountProfile {
  return { id: account.id, name: account.name, username: account.username, avatar: account.avatar };
}
