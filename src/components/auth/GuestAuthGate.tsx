"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog, DialogContent } from "@mui/material";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import AuthForm from "./AuthForm";
import { installGuestAuthTrigger } from "@/utils/guest-auth-trigger";

export default function GuestAuthGate({ guest, children }: { guest: boolean; children: ReactNode }) {
  const { data: session, status } = useSession();
  const isGuest = status === "loading" ? guest : !session?.user?.accessToken;
  const params = useSearchParams();
  const requested = params.get("auth");
  const requestedMode = requested === "signin" || requested === "signup" ? requested : null;
  const [mode, setMode] = useState<"signin" | "signup" | null>(null);
  const background = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isGuest) return;
    return installGuestAuthTrigger(document, value => setMode(previous => previous ?? value));
  }, [isGuest]);
  const open = isGuest && (mode !== null || requestedMode !== null);
  useEffect(() => {
    if (!open) return;
    // The app scrolls inside main rather than body. Lock that surface too.
    const main = background.current?.querySelector<HTMLElement>("#main-content");
    if (!main) return;
    const previous = main.style.overflowY;
    main.style.overflowY = "hidden";
    return () => { main.style.overflowY = previous; };
  }, [open]);

  return <>
    <div ref={background} inert={open} style={{ display: "contents" }}>{children}</div>
    <Dialog data-guest-auth-dialog open={open} onClose={() => { /* Authentication is required to continue. */ }} aria-labelledby="guest-auth-title" aria-describedby="guest-auth-description"
      maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, m: 2, width: "calc(100% - 32px)", maxHeight: "calc(100dvh - 32px)" } } }}>
      <DialogContent sx={{ p: { xs: 2.5, sm: 4 } }}><AuthForm initialMode={requestedMode ?? mode ?? "signup"} /></DialogContent>
    </Dialog>
  </>;
}
