import { auth } from "@/auth";
import React, { cache } from "react";
import NotificationContainer from "./NotificationContainer";
// import {
//   getUserNotifications,
//   getUserNotificationStats,
// } from "@/lib/actions/notifications";

const getNotificationsCached = cache(async (userId: string) => {
  // const result = await getUserNotifications({ userId, skip: 0, limit: 20 });
  // return result.data ? result.data : [];
  return []
});

const getNotificationStatsCached = cache(async (userId: string) => {
  const stats = {
    totalUnseenCount: 0,
    totalUnreadCount: 0,
  };
  // const result = await getUserNotificationStats(userId);
  // return result.data ? result.data : stats;
  return stats;
});

const NotificationServer = async () => {
  const session = await auth();
  if (!session) return null;
  const userId = String(session?.user?.id);
  const [stats, data] = await Promise.all([
    getNotificationStatsCached(userId),
    getNotificationsCached(userId),
  ]);

  return <NotificationContainer stats={stats} data={data} />;
};

export default NotificationServer;
