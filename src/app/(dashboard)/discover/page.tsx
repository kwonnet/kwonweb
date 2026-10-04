import { getServerSession } from "@/lib/server-session";
import { apiUrl } from "@/config";
import { TrendingTopics } from "@/types";
import PageClient from "./PageClient";

const Page = async () => {
  const session = await getServerSession();
  const query = new URLSearchParams({ limit: "50" });
  if (session?.user?.country?.id) query.set("country", session.user.country.id);
  const result = await fetch(`${apiUrl}/discover/trend?${query}`, {
    cache: "no-store",
    method: "GET",
    credentials: "include",
    mode: "cors",
    headers: session?.user?.accessToken ? { Authorization: `Bearer ${session.user.accessToken}` } : {},
  });
  if (!result.ok) return null
  const data: TrendingTopics[] = await result.json();
  return <PageClient trends={data} />;
};

export default Page;

