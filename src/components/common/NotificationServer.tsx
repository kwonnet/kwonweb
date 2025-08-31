import { auth } from "@/auth";
import React, { cache } from "react";
import NotificationContainer from "./NotificationContainer";
import { apiUrl } from "@/config";
import { UserStats } from "@/types/user";
import { AppNotification } from "@/types";


const getNotificationsCached = cache(async (userId: string, token?: string) => {
  // const result = await fetch(`${apiUrl}/users/${userId}/notifications?limit=21&page=1`, {
  //   method: "GET",
  //   next: { revalidate: 60, tags: [`user-${userId}-notifications`] },
  //   credentials: "include",
  //   mode: "cors",
  //   headers: {
  //     "Content-Type": `application/json`,
  //     Authorization: `Bearer ${token}`,
  //   },
  // });
  // if(!result.ok) return undefined
  // return await result.json() as AppNotification[];
  return []
});

const getNotificationStatsCached = cache(async (userId: string, token?: string) => {
  const result = await fetch(`${apiUrl}/users/${userId}/stats`, {
    method: "GET",
    next: { revalidate: 60, tags: [`user-${userId}-stats`] },
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": `application/json`,
      Authorization: `Bearer ${token}`,
    },
  });
  if(!result.ok) return undefined
  return await result.json() as UserStats;
});

const NotificationServer = async () => {
  const session = await auth();
  if (!session) return null;
  const userId = String(session?.user?.id);
  const [stats, data] = await Promise.all([
    getNotificationStatsCached(userId, session?.user?.accessToken),
    getNotificationsCached(userId),
  ]);

  return <NotificationContainer stats={stats} data={data} />;
};

export default NotificationServer;
