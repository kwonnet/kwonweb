import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { ACTIVE_SESSION_COOKIE, ACCOUNT_LIMIT, ACCOUNT_MAX_AGE, activeSessionCookieName, authCookieNames, cookieValue, logoutTime, sessionCookieBase, sessionLoginTime, sessionWasLoggedOut } from "./lib/account-session-policy";
import { getToken } from "next-auth/jwt";
import { accountCookieName, encodeAccount, readSavedAccounts } from "./lib/saved-accounts";
import { shouldRefreshAccessToken } from "./lib/auth-refresh-policy";
import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { SignInSchema, SignUpSchema } from "./schema";
import { apiUrl } from "./config";
import { ZodError } from "zod";
import { UserPublic } from "./types/user";
import { authOrigin, configureAuthOrigin, safeAuthRedirect, signInRedirect } from "./lib/auth-redirect";

// Augment the User type in next-auth
declare module "next-auth" {
  interface User extends UserPublic {
    id?: string;
    email?: string | null;
    name?: string | null;
    username?: string | null;
    image?: string | null;
    accessToken?: string | null;
  }
  // interface Session {
  //   user: {
  //     id: string;
  //     email: string;
  //     name: string;
  //     username: string;
  //     token: string;
  //   };
  // }
  interface Session extends DefaultSession {
    user: UserPublic & {
      id: string;
      email: string;
      name: string;
      username: string;
      image?: string;
      accessToken: string;
    };
  }
}

class NextAuthError extends CredentialsSignin {
  constructor(message: string) {
    super();
    this.code = message;
    this.message = message;
  }
}


configureAuthOrigin();

const authRuntime = NextAuth(async request => {
  const requestHeaders = request?.headers ?? await headers();
  const loggedOutAt = logoutTime(requestHeaders.get("cookie"));
  const activeGeneration = cookieValue(requestHeaders.get("cookie"), ACTIVE_SESSION_COOKIE);
  const secure = new URL(process.env.AUTH_URL || request?.url || "http://localhost").protocol === "https:";
  const loginGeneration = request?.method === "POST" && new URL(request.url).pathname.startsWith("/api/auth/callback/") ? crypto.randomUUID() : null;
  const sessionCookie = loginGeneration ? `${sessionCookieBase(secure)}-${loginGeneration}` : activeSessionCookieName(requestHeaders.get("cookie"), secure);
  return {
  useSecureCookies: secure,
  cookies: { sessionToken: { name: sessionCookie, options: { httpOnly: true, sameSite: "lax", path: "/", secure } } },
  session: {
    strategy: "jwt",
    // maxAge: 5 * 60
  },
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      id: "saved-account",
      credentials: { accountId: { type: "text" } },
      async authorize(credentials, request) {
        const cookieHeader = request.headers.get("cookie") || "";
        const jar = { getAll: () => cookieHeader.split(";").map(part => {
          const index = part.indexOf("=");
          return { name: part.slice(0, index).trim(), value: part.slice(index + 1).trim() };
        }) };
        const account = (await readSavedAccounts(jar, secure)).find(account => account.id === credentials.accountId);
        if (!account) throw new NextAuthError("Please log in to this account again.");
        const response = await fetch(`${apiUrl}/auth/refresh-token`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: account.accessToken }), signal: AbortSignal.timeout(8000), cache: "no-store",
        });
        if (!response.ok) throw new NextAuthError("Please log in to this account again.");
        const { user, accessToken } = await response.json();
        if (user?.id !== account.id || typeof accessToken !== "string") throw new NextAuthError("Please log in to this account again.");
        return { ...user, image: user.avatar, accessToken };
      },
    }),
    Credentials({
      id: "credentials-up",
      name: "Credentials",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const body = SignUpSchema.parse(credentials);
          // if(body) throw new NextAuthError("Ref ID not provided")
          const res = await fetch(`${apiUrl}/auth/signup`, {
            method: "POST",
            body: JSON.stringify(body),
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) {
            throw new NextAuthError(await res.text());
          }
          const data = await res.json();
          const { user, accessToken } = data;

          return { ...user, image: user?.avatar, accessToken };
        } catch (error: any) {
          let message = error.message;
          if (error instanceof ZodError) {
            const issues = error.issues;
            message = issues.map((issue) => issue.message).join(", ");
          }
          throw new NextAuthError(message);
        }
      },
    }),
    Credentials({
      id: "credentials-in",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const body = SignInSchema.parse(credentials);
          const res = await fetch(`${apiUrl}/auth/signin`, {
            method: "POST",
            body: JSON.stringify(body),
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (!res.ok) {
            throw new NextAuthError(await res.text());
          }
          const data = await res.json();
          const { user, accessToken } = data;

          return { ...user, image: user?.avatar, accessToken };
        } catch (error: any) {
          let message = error.message;
          if (error instanceof ZodError) {
            const issues = error.issues;
            message = issues.map((issue) => issue.message).join(", ");
          }
          throw new NextAuthError(message);
        }
      },
    }),
  ],

  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isPublicPage = nextUrl.pathname.startsWith("/public");

      if (isPublicPage || isLoggedIn || nextUrl.pathname === "/" || nextUrl.pathname === "/auth/signin") {
        return true;
      }

      return Response.redirect(signInRedirect(nextUrl.href));
    },
    signIn({ user }) {
      if (!user) throw new NextAuthError("Login failed.");
      return true;
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user as any;
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      if (token && user) {
        token.sessionIssuedAt = Math.max(Date.now(), loggedOutAt + 1);
        token.sessionGeneration = loginGeneration ?? crypto.randomUUID();
        token.user = user;
        token.accessTokenRefreshedAt = Date.now();
      }
      if (!user && sessionWasLoggedOut(token, loggedOutAt)) return null;
      if (!user && activeGeneration && token.sessionGeneration !== activeGeneration) return null;
      token.sessionIssuedAt ??= sessionLoginTime(token);
      if (token && !user && (trigger === "update" || shouldRefreshAccessToken(
        (token.user as { accessToken?: string } | undefined)?.accessToken, token.accessTokenRefreshedAt
      ))) {
        // console.log("token & no user ")
        // refresh access token
        const currAccessToken = (token.user as { accessToken?: string } | undefined)?.accessToken;
        const res = await fetch(`${apiUrl}/auth/refresh-token`, {
          signal: AbortSignal.timeout(8000),
          method: "POST",
          credentials: "include",
          body: JSON.stringify({token: currAccessToken}),
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          throw new NextAuthError(await res.text());
        }

        const data = await res.json();
        const { user, accessToken } = data;
        token.user = {...user, image: user?.avatar, accessToken };
        token.accessTokenRefreshedAt = Date.now();
      }
      return token;
    },

    async redirect({ url, baseUrl }) {
      return safeAuthRedirect(url, authOrigin(baseUrl));
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
};
});

export const { auth, signIn, signOut } = authRuntime;
export const handlers = {
  GET: authRuntime.handlers.GET,
  async POST(request: NextRequest) {
    const response = await authRuntime.handlers.POST(request);
    if (new URL(request.url).pathname.startsWith("/api/auth/callback/")) {
      // A late refresh from the previous account cannot become the active identity.
      const secure = new URL(authOrigin(request.url)).protocol === "https:";
      const base = sessionCookieBase(secure);
      const cookieName = response.headers.getSetCookie().map(cookie => cookie.split("=")[0]).find(name =>
        name.startsWith(`${base}-`) && /^[0-9a-f-]{36}$/i.test(name.slice(base.length + 1).replace(/\.\d+$/, ""))
      )?.replace(/\.\d+$/, "");
      if (!cookieName) return response; // Failed authentication must preserve the current account.
      const cookieHeader = response.headers.getSetCookie().map(cookie => cookie.split(";")[0]).join("; ");
      const token = await getToken({ req: new Request(request.url, { headers: { cookie: cookieHeader } }), secret: process.env.AUTH_SECRET, cookieName, salt: cookieName });
      if (typeof token?.sessionGeneration === "string") {
        response.headers.append("Set-Cookie", `${ACTIVE_SESSION_COOKIE}=${token.sessionGeneration}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ACCOUNT_MAX_AGE}${cookieName.startsWith("__Secure-") ? "; Secure" : ""}`);
        // Refresh responses from an older identity can only write that identity's
        // cookie, never overwrite this generation's session. Retire unused cookies.
        for (const name of authCookieNames(request.cookies.getAll().map(cookie => cookie.name))) {
          if (name !== cookieName && !name.startsWith(`${cookieName}.`) && name.includes("session-token")) {
            response.headers.append("Set-Cookie", `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`);
          }
        }
        const user = token.user as { id?: string; name?: string; username?: string; avatar?: string; image?: string; accessToken?: string };
        if (user?.id && user.name && user.username && user.accessToken) {
          // Save on the successful callback itself, before the client session read.
          // Optional device storage must never undo successful authentication.
          try {
            const saved = await readSavedAccounts(request.cookies, secure);
            const account = { id: user.id, name: user.name, username: user.username, avatar: user.avatar || user.image, accessToken: user.accessToken, savedAt: Date.now() };
            const value = await encodeAccount(account, secure);
            const suffix = `; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ACCOUNT_MAX_AGE}${secure ? "; Secure" : ""}`;
            response.headers.append("Set-Cookie", `${accountCookieName(user.id, secure)}=${value}${suffix}`);
            for (const removed of saved.filter(account => account.id !== user.id).slice(ACCOUNT_LIMIT - 1)) {
              response.headers.append("Set-Cookie", `${accountCookieName(removed.id, secure)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`);
            }
          } catch { /* Device account storage is optional. */ }
        }
      }
    }
    return response;
  },
};
