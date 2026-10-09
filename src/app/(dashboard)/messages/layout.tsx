import MessagingShell from "./MessagingShell";
import ChatListServer from "./[[...slug]]/ChatListServer";
import MessagingViewport from "./MessagingViewport";
import type { Viewport } from "next";
import type { ReactNode } from "react";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", interactiveWidget: "resizes-content" };

// The root provider keeps messaging unlocked across application navigation.
export default function MessagingLayout({ children }: { children: ReactNode }) {
  return <MessagingViewport><MessagingShell chats={<ChatListServer slug="chat" />} requests={<ChatListServer slug="requests" />}>{children}</MessagingShell></MessagingViewport>;
}
