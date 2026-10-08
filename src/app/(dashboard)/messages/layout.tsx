import ConvoSocketIoProvider from "@/context/ConvoSocketIoContext";
import type { ReactNode } from "react";

// Keep the unlocked vault and socket alive across Inbox, Requests and chat routes.
// The provider still locks on leaving messaging, account changes and inactivity.
export default function MessagingLayout({ children }: { children: ReactNode }) {
  return <ConvoSocketIoProvider>{children}</ConvoSocketIoProvider>;
}
