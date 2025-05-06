import React from "react";
import PageClient from "./PageClient";
import { CryptoAddress, SubscriptionPlan } from "@/types";
import { getCurrent_ton_usd_rate } from "@/utils";
import { apiUrl } from "@/config";

const url = apiUrl + "/subscriptions/plans";

const cryptourl = apiUrl + "/crypto/addresses";

const Page = async () => {
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

  return (
    <PageClient
      plans={plans}
      tonRate={currentTonRate}
      cryptoAddreses={addresses}
    />
  );
};

export default Page;


