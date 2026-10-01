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

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    // maxAge: 5 * 60
  },
  secret: process.env.AUTH_SECRET,
  providers: [
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
          console.log("Sign up credentials - ",body)
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

      if (isPublicPage || isLoggedIn || nextUrl.pathname === "/auth/signin") {
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
    async jwt({ token, user }) {
      if (token && user) {
        token.user = user;
      }
      if (token && !user) {
        // console.log("token & no user ")
        // refresh access token
        const currAccessToken = (token.user as { accessToken: string }).accessToken;
        const res = await fetch(`${apiUrl}/auth/refresh-token`, {
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
});
