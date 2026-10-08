import ConvoSocketIoProvider from "@/context/ConvoSocketIoContext";
import type { Viewport } from "next";
import type { ReactNode } from "react";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", interactiveWidget: "resizes-content" };

// Keep the unlocked vault and socket alive across Inbox, Requests and chat routes.
// The provider still locks on leaving messaging, account changes and inactivity.
export default function MessagingLayout({ children }: { children: ReactNode }) {
  return <ConvoSocketIoProvider>{children}</ConvoSocketIoProvider>;
}
