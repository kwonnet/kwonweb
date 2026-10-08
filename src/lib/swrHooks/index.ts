import { apiUrl } from "@/config";
import { publicEnv } from "@/config/public-env";
import { axiosAPI } from "@/config/axios";
import { CurrUserStats, GamePlayer, Task, Transaction, Wallet } from "@/types";
import { cache } from "react";
import useSWR from "swr";
import { getUserCoinsWallet } from "../wallets";
import { AxiosResponse } from "axios";
import { getAuthUser } from "../auth";
import { AccountAnalytics, UserStats } from "@/types/user";
// import { getUserNotificationStats } from "../users";

// const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + "/api"

const baseUrl = publicEnv("NEXT_PUBLIC_API_URL") + "/api";

// export const getSwrPlayers = cache(async(url: string) => {
//     try {
//         const result = await fetch(baseUrl+url, {
//             method: "GET",
//             next: { revalidate: 30 },
//             credentials: "include",
//             mode: "cors"
//         })
//         if(!result.ok) throw new Error("Sorry, en error occurred while fetching data")
//         return await result.json() as GamePlayer[]
//     } catch (error) {
//         throw error
//     }
// })

export const getSwrPlayers = cache(
  async ({ query, token }: { query: string; token?: string }) => {
    try {
      axiosAPI.accessToken = token;
      const result = await axiosAPI.get(query);
      console.log("leaderboad data ", result.data);
      return result.data as GamePlayer[];
    } catch (error) {
      throw error;
    }
  }
);

export const useUserCoinsWallet = (token?: string, fallbackData?: Wallet) => {
  const result = useSWR(
    token ? ["/v1/wallets", token] : null,
    ([_, token]) => getUserCoinsWallet(token),
    { keepPreviousData: true, fallbackData, revalidateOnMount: fallbackData === undefined }
  );
  return result;
};

export const getUserStats = cache(async (url: string, token?: string) => {
  try {
    axiosAPI.accessToken = token;
    const result = await axiosAPI.get(url);
    return result.data as UserStats;
  } catch (error) {
    throw error;
  }
});

export const useUserStats = ({
  fallbackData,
  userId,
  token,
}: {
  userId: string;
  fallbackData?: UserStats;
  token?: string;
}) => {
  const fallback: UserStats = fallbackData ? fallbackData : {totalAwards: 0, totalEarned: 0, totalInvites: 0, totalTaskDone: 0, totalTaskNotDone: 0, totalTxns: 0, totalUnreadCount: 0, totalUnreadMsg: 0, totalUnseenCount: 0, totalUnseenMsg: 0}
  const result = useSWR(
    userId && token ? [`/v1/users/${userId}/stats`, token] : null,
    ([url, token]) => getUserStats(url, token),
    { keepPreviousData: true, fallbackData: fallback, revalidateOnMount: fallbackData === undefined }
  );
  return result;
};

export const getUserAccountAnalytics = cache(
  async (url: string, token?: string) => {
    try {
      axiosAPI.accessToken = token;
      const result = await axiosAPI.get(url);
      return result.data as AccountAnalytics[];
    } catch (error) {
      throw error;
    }
  }
);

export const useAccountAnalytics = (
  args: { userId: string; analytics: AccountAnalytics[]; duration: string },
  token?: string
) => {
  const result = useSWR(
    [
      `/v1/users/${args.userId}/account-analytics?duration=${args.duration}`,
      token,
    ],
    ([url, token]) => getUserAccountAnalytics(url, token),
    { keepPreviousData: false, fallbackData: args.analytics, revalidateOnMount: args.analytics === undefined }
  );
  return result;
};

export const usePostAnalytics = (
  args: { id: string; analytics: AccountAnalytics[]; duration: string },
  token?: string
) => {
  const result = useSWR(
    [`/v1/posts/${args.id}/post-analytics?duration=${args.duration}`, token],
    ([url, token]) => getUserAccountAnalytics(url, token),
    { keepPreviousData: false, fallbackData: args.analytics, revalidateOnMount: args.analytics === undefined }
  );
  return result;
};

export const getSWRTxnHistory = cache(
  async (url: string, token?: string): Promise<{ data: Transaction[]; nextCursor: string }> => {
    const response = await fetch(`${apiUrl}${url.startsWith('/v1/') ? url.slice(3) : url}`, { credentials: 'include', cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Unable to load transaction history.');
    const data = await response.json() as Transaction[];
    return { data, nextCursor: data.at(-1)?.id ?? '' };
  }
);

export const getTasks = cache(
  async (url: string): Promise<{ data: Task[]; nextCursor: string }> => {
    try {
      let res: AxiosResponse = await axiosAPI.get(url);
      const data = res.data as Task[];
      return { data, nextCursor: data.at(-1)?.id ?? '' };
    } catch (error: any) {
      throw error;
    }
  }
);

export const getUserTaskSettings = cache(
  async (
    url: string,
    token?: string
  ): Promise<{
    id: string;
    userId: string;
    dailyBonusDate: string;
    adsBonusDate: string;
    createdAt: string;
    updateAt: string;
  }> => {
    axiosAPI.accessToken = token;
    try {
      axiosAPI.accessToken = token;
      let res: AxiosResponse = await axiosAPI.get(url);
      return res.data;
    } catch (error: any) {
      throw error;
    }
  }
);

export const useCurrentAuthUser = (token?: string) => {
  const result = useSWR(
    ["/current-user", token],
    ([_, token]) => getAuthUser(token),
    { keepPreviousData: true }
  );
  return result;
};

// export const useUserStats = (args: { userId: string, fallbackData?: UserStats, token?: string}) => {
//   const result = useSWR(
//     { type: "notif_stats", userId: user?.id },
//     (args) => getUserNotificationStats(args.userId, token),
//     {
//       fallbackData: stats,
//     }
//   )
// }
