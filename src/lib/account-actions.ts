"use client";
import { signIn, signOut } from "next-auth/react";
import { axiosAPI } from "@/config/axios";
import { apiUrl } from "@/config";

export async function rememberCurrentAccount() {
  const response = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remember" }), cache: "no-store" });
  if (!response.ok) throw new Error("Unable to save this account on this device. Please try again.");
}
export async function switchAccount(accountId: string) {
  const result = await signIn("saved-account", { accountId, redirect: false, redirectTo: "/" });
  if (!result || result.error) return false;
  // Discard sockets, private React/SWR data and the server-rendered previous identity.
  axiosAPI.accessToken = undefined;
  window.location.replace("/");
  return true;
}
export async function logoutCurrentAccount() {
  const response = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }), cache: "no-store" });
  if (!response.ok) throw new Error("Unable to sign out. Please try again.");
  axiosAPI.accessToken = undefined;
  // Also remove historical cookies on the API host. Local logout remains effective
  // if that host is temporarily unreachable; explicit bearer auth takes precedence.
  try { await fetch(`${apiUrl}/auth/logout`, { method: "POST", credentials: "include", signal: AbortSignal.timeout(5000) }); } catch {}
  try { await signOut({ redirect: false, redirectTo: "/" }); } finally { window.location.replace("/"); }
}
