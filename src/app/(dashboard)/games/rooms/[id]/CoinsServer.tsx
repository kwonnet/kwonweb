import React from "react";
import CoinsClient from "./CoinsClient";
import { CoinPackage, CryptoAddress } from "@/types";
import { getCurrent_ton_usd_rate } from "@/utils";
import { apiUrl } from "@/config";
import { getServerSession } from "@/lib/server-session";

type IData = { packages: CoinPackage[]; addresses: CryptoAddress[] };

const url = apiUrl + "/coins";

const CoinsServer = async () => {
  const session = await getServerSession();

  if (!session) return null;

  const result = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${session.user.accessToken}` },
    next: { revalidate: 0 },
  });

  let data: IData = { addresses: [], packages: [] };

  if (result.ok) {
    data = await result.json();
  }

  let currentTonRate: number = 0;

  const rate = await getCurrent_ton_usd_rate();

  if (rate) {
    currentTonRate = rate;
  }

  return <CoinsClient data={data} currentTonRate={currentTonRate} isPage={false} />;
};

export default CoinsServer;
