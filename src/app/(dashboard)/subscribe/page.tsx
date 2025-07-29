import React from "react";
import { CryptoAddress, SubscriptionPlan } from "@/types";
import { getCurrent_ton_usd_rate } from "@/utils";
import { apiUrl } from "@/config";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PageClient from "./PageClient";
// import dynamic from "next/dynamic";

// const PageClient = dynamic(() => import("./PageClient").then(mod => mod.default), {
//   loading: () => <div>Loading...</div>,
// })


const url = apiUrl + "/subscriptions/plans";

const cryptourl = apiUrl + "/crypto/addresses";

const Page = async () => {
  const session = await auth()
  if(!session) redirect("/")
  const result = await fetch(url, { method: "GET", next: { revalidate: 0 } });

  let plans: SubscriptionPlan[] = [];

  if (result.ok) {
    plans = await result.json();
  }

  let currentTonRate: number = 0;

  const rate = await getCurrent_ton_usd_rate();

  if (rate) {
    currentTonRate = rate;
  }
  const result2 = await fetch(cryptourl, {
    method: "GET",
    next: { revalidate: 0 },
  });

  let addresses: CryptoAddress[] = [];
  if (result2.ok) {
    addresses = await result2.json();
  }

  const user = session.user

  const subPlans = plans.filter((item) => item.accountType === user?.userType);


  return (
    <PageClient
      plans={plans}
      tonRate={currentTonRate}
      cryptoAddreses={addresses}
    />
  );
};

export default Page;


