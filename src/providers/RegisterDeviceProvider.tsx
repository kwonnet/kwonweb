"use client";

import { useEffect, type ReactNode } from "react";
import useAuthSession from "@/hooks/useAuthSession";
import { apiUrl } from "@/config";

// Deduplicate registration if providers remount while encryption is loading.
const registrations = new Map<string, Promise<void>>();

function registerDevice(userId: string, token: string) {
  const existing = registrations.get(userId);
  if (existing) return existing;
  const work = (async () => {
    const { checkDeviceExists, generateDeviceBundle } = await import("@/lib/sodium/crypto");
    const deviceId = `d_${userId.slice(-10)}`;
    if (await checkDeviceExists(deviceId)) return;
    const device = await generateDeviceBundle(deviceId);
    const response = await fetch(`${apiUrl}/conversations/users/${userId}/register-device`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(device.publicBundle),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Device registration failed (${response.status})`);
    const { set } = await import("idb-keyval");
    await set(device.storeKey, device.privateBundle);
  })();
  registrations.set(userId, work);
  void work.finally(() => registrations.delete(userId)).catch(() => {});
  return work;
}

export default function RegisterDeviceProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuthSession();
  useEffect(() => {
    if (!user?.id || !token) return;
    const run = () => { void registerDevice(user.id, token).catch(() => console.warn("Device registration unavailable; retry on next session change.")); };
    // Load crypto after the first paint, not as part of the page's initial bundle.
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(run, 500);
    return () => clearTimeout(id);
  }, [user?.id, token]);
  return children;
}
