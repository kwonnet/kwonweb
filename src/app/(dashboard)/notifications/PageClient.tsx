"use client";
import NotificationClient from "@/components/common/NotificationClient";
import { useAuthSession } from "@/hooks";
import type { AppNotification } from "@/types";
export default function PageClient({ items, initialUserId }: { items: AppNotification[]; initialUserId: string }) {
  const { user } = useAuthSession();
  return <NotificationClient items={user?.id === initialUserId ? items : undefined} close={() => {}} />;
}
