import { getServerSession } from "@/lib/server-session";
import { apiUrl } from "@/config";
import { TrendingTopics } from "@/types";
import React from "react";
import { Session } from "next-auth";
import PageClient from "./PageClient";

const getQuery = (session: Session | null) => {
  // console.log(session)
  // if(session?.user?.country){
  //   return `country=${session?.user?.country?.iso2}&limit=50`
  // }
  // return `limit=50`
  return `country=NG&limit=50`
}
const Page = async () => {
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
  return <PageClient trends={data} />;
};

export default Page;

