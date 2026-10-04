import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import { authOrigin, safeAuthRedirect } from "@/lib/auth-redirect";

export default async function SignInPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : "/";
  const session = await getServerSession();
  if (session?.user?.accessToken) redirect(safeAuthRedirect(callbackUrl, authOrigin("http://localhost:3000")));
  const query = new URLSearchParams({ auth: "signin", callbackUrl });
  if (typeof params.refId === "string") query.set("refId", params.refId);
  redirect(`/?${query}`);
}
