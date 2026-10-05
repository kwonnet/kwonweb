import {pageMetadata} from '@/lib/seo';
import { getServerSession } from "@/lib/server-session";
import { apiUrl } from "@/config";
import { TrendingTopics } from "@/types";
import React from "react";
import { Session } from "next-auth";
import PageClient from "./PageClient";

const getQuery = (session: Session | null) => {
//   console.log(session)
//   if(session?.user?.country){
//     return `country=global&limit=50`
//   }
//   return `limit=50`
return `limit=50`
}
const Page = async () => {
  const session = await getServerSession();
  const query = getQuery(session)
  const result = await fetch(`${apiUrl}/discover/trend?limit=50`, {
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


export const metadata = pageMetadata('Worldwide trends', 'Worldwide trends on Kwonnet. Connect with your community and manage your experience.', '/discover/worldwide', false);
