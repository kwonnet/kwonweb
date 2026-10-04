import { getServerSession } from "@/lib/server-session";
import { apiUrl } from "@/config";
import { TrendingTopics } from "@/types";
import React from "react";
import SidebarTrendClient from "./SidebarTrendClient";
import { Session } from "next-auth";

const getQuery = (session: Session | null) => {
  if(session?.user?.country){
    return `country=${session?.user?.country?.iso2}&limit=50`
  }
  return `limit=50`
}
const SidebarTrendServer = async () => {
  const session = await getServerSession();
  const query = getQuery(session)
  const result = await fetch(`${apiUrl}/discover/trend?${query}`, {
    cache: "no-store",

    method: "GET",
    credentials: "include",
    mode: "cors",
    headers: {
      Authorization: `Bearer ${session?.user?.accessToken}`,
    },
  });
  if (!result.ok) return null
  const data: TrendingTopics[] = await result.json();
  return <SidebarTrendClient trends={data} />;
};

export default SidebarTrendServer;

