'use client'
import { apiUrl } from '@/config';
import { axiosAPI } from "@/config/axios";
import { CurrentAuthUser } from "@/types";

export const getAuthUser = async(token?: string) => {
    try {
          axiosAPI.accessToken = token
          const result = await axiosAPI.get(`/v1/auth/me`)
          return result.data as CurrentAuthUser
      } catch (error: any) {
          throw error
      }
}

export const getTmaAuthUser = async(payload: {
    tmaData: any;
    ref?: string;
    tmaRaw?: string;
} ) => {
    try {
        const result = await axiosAPI.post("/v1/auth", payload)
        return result.data as { user: CurrentAuthUser, token: string }
    } catch (error) {
        throw error
    }
}

export type ActiveUserSession = {
  id: string; provider: string; current: boolean;
  device: {browser?: string | null; os?: string | null; type?: string | null} | null;
  location: {city?: string; country?: string} | null;
  createdAt: string; lastActiveAt: string; expiresAt: string;
};
export async function getActiveSessions(token: string, page = 1): Promise<{sessions: ActiveUserSession[]; page: number; hasMore: boolean}> {
  const response = await fetch(`${apiUrl}/auth/sessions?page=${page}`, {headers: {Authorization: `Bearer ${token}`}, cache: 'no-store', signal: AbortSignal.timeout(15_000)});
  if (!response.ok) throw new Error('Unable to load sessions.');
  return response.json();
}
export async function revokeActiveSession(token: string, id: string) {
  const response = await fetch(`${apiUrl}/auth/sessions/${encodeURIComponent(id)}`, {method: 'DELETE', headers: {Authorization: `Bearer ${token}`}, signal: AbortSignal.timeout(15_000)});
  if (!response.ok && response.status !== 404) throw new Error('Unable to revoke this session.');
}

export async function getAccountSettings(token: string): Promise<{username: string; hasPassword: boolean}> {
  const response = await fetch(`${apiUrl}/auth/settings`, {headers: {Authorization: `Bearer ${token}`}, cache: 'no-store', signal: AbortSignal.timeout(15_000)});
  if (!response.ok) throw new Error('Unable to load account settings');
  return response.json();
}
export async function changePassword(token: string, currentPassword: string | undefined, newPassword: string) {
  const response = await fetch(`${apiUrl}/auth/password`, {method: 'PATCH', headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'}, body: JSON.stringify({currentPassword, newPassword}), signal: AbortSignal.timeout(15_000)});
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || (response.status === 401 ? 'Sign in again before updating your password.' : 'Unable to update password. Please try again.'));
  return {reloginRequired: result?.reloginRequired === true};
}
