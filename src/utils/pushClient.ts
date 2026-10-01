"use client";

import { publicEnv } from "@/config/public-env";
import { apiUrl } from "@/config";
import { axiosAPI } from "@/config/axios";
import { getErrorMessage } from ".";

export async function subscribeUserToPush(accessToken?: string) {
  try {
    // console.log(
    //   "NEXT_PUBLIC_VAPID_PUBLIC_KEY ",
    //   publicEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY")
    // );
    // console.log(Notification.permission)
    // new Notification("Test Notification", {
    //     body: "If you see this, notifications are working!",
    //     icon: "/favicon-32x32.png",
    //   });
    if (!accessToken){
      return { status: 400, message: "Invalid access token provided " };
    }
    if ("serviceWorker" in navigator && "PushManager" in window) {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();

      if (!existing) {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            publicEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY")!
          ),
        });
        axiosAPI.accessToken = accessToken;
        await axiosAPI.post(
          `${apiUrl}/api/v1/notifications/subscribe`,
          subscription
        );

        return { status: 200, message: "Notifications enabled" };
      }
      return { status: 200, message: "Notifications already enabled" };
    }
    return {
      status: 400,
      message: "Unsuported browser, push manager not available",
    };
  } catch (error) {
    console.log(error);
    return { status: 400, message: getErrorMessage(error) };
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const raw = window.atob(base64);
  return new Uint8Array([...raw].map((char) => char.charCodeAt(0)));
}
