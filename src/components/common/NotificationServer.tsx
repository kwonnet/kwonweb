import { getServerSession } from "@/lib/server-session";
import React, { cache } from "react";
import NotificationContainer from "./NotificationContainer";
import { apiUrl } from "@/config";
import { UserStats } from "@/types/user";
import { AppNotification } from "@/types";


const getNotificationsCached = cache(async (userId: string, token?: string) => {
  const response = await fetch(`${apiUrl}/users/${userId}/notifications?limit=21&page=1`, { cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
  return response?.ok ? await response.json() as AppNotification[] : undefined;
});

export const getNotificationStatsCached = cache(async (userId: string, token?: string) => {
  const result = await fetch(`${apiUrl}/users/${userId}/stats`, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": `application/json`,
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => undefined);
  if(!result?.ok) return undefined
  return await result.json() as UserStats;
});

const NotificationServer = async () => {
  const session = await getServerSession();
  if (!session) return null;
  const userId = String(session?.user?.id);
  const [stats, data] = await Promise.all([
    getNotificationStatsCached(userId, session?.user?.accessToken),
    getNotificationsCached(userId, session?.user?.accessToken),
  ]);

  return <NotificationContainer stats={stats} data={data} initialUserId={userId} />;
};

export default NotificationServer;
