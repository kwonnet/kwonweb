import React from "react";
import PageClient from "./PageClient";
import DisplayError from "@/components/common/DisplayError";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiUrl } from "@/config";
import { getServerSession } from "@/lib/server-session";
import { redirect } from "next/navigation";
import { AccountAnalytics } from "@/types/user";

const durationList = [
  {id: "3h", isPro: false},
  {id: "6h", isPro: false},
  {id: "12h", isPro: false},
  {id: "24h", isPro: false},
  {id: "3d", isPro: false},
  {id: "7d", isPro: false},
  {id: "14d", isPro: false},
  {id: "21d", isPro: false},
  {id: "30d", isPro: false},
  {id: "3M", isPro: true},
  {id: "6M", isPro: true},
  {id: "9M", isPro: true},
  {id: "12M", isPro: true},
  {id: "2y", isPro: true},
];

type URLParams = {
  username: string;
  slug: string[];
};

const page = async ({ params }: { params: Promise<URLParams> }) => {
  
  const _params = await params;

  const session = await getServerSession();

  const identifier = _params?.username?.replace("%40", "");

  if (!session || !identifier || session?.user?.username !== identifier) return redirect("/")

  const user = session?.user

  const result = await fetch(`${apiUrl}/users/${user?.id}/account-analytics?duration=3h`, {
    method: "GET",
    next: { revalidate: 60, tags: [`user-${user.id}-analytics`] },
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": `application/json`,
      Authorization: `Bearer ${session?.user?.accessToken}`,
    },
  });

  if (!result.ok) {
    const message = await result.text();
    return <DisplayError status={result.status} message={message} />;
  }

  const analytics: AccountAnalytics[] = await result.json()

  const durationItems = user?.meta?.isPro ? durationList : durationList.filter(item => !item.isPro)

  return (<PageClient analytics={analytics} durationItems={durationItems} />)

}

export default page;
