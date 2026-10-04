"use client";
import { Avatar, IconButton, Popover } from "@mui/material";
import { useState } from "react";
import { useAuthSession } from "@/hooks";
import AccountToolbar from "./AccountToolbar";

export default function AccountMenu() {
  const { user } = useAuthSession();
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  return <>
    <IconButton aria-label="Account menu" aria-haspopup="dialog" aria-expanded={Boolean(anchor)} aria-controls={anchor ? "account-menu" : undefined} onClick={event => setAnchor(event.currentTarget)}>
      <Avatar src={user?.avatar || user?.image || undefined} alt={user?.name ?? "Account"} sx={{ width: 32, height: 32 }} />
    </IconButton>
    <Popover id="account-menu" open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
      <div role="dialog" aria-label="Account" onClick={event => { if ((event.target as HTMLElement).closest("a")) setAnchor(null); }}><AccountToolbar /></div>
    </Popover>
  </>;
}
