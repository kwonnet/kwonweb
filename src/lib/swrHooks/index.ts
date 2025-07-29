import { axiosAPI } from "@/config/axios";
import { CurrUserStats, GamePlayer, Task, Transaction } from "@/types";
import { cache } from "react";
import useSWR from "swr";
import { getUserCoinsWallet } from "../wallets";
import { AxiosResponse } from "axios";
import { getAuthUser } from "../auth";

// const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + "/api"

const baseUrl = process.env.NEXT_PUBLIC_API_URL + "/api"


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

export const getSwrPlayers = cache(async({query, token}: { query: string; token?: string}) => {
    try {
        axiosAPI.accessToken = token
        const result = await axiosAPI.get(query)
        console.log("leaderboad data ",result.data)
        return result.data as GamePlayer[]
    } catch (error) {
        throw error
    }
})

export const useUserCoinsWallet = (token?: string) => {
    const result = useSWR(['/v1/wallets', token], ([_, token]) => getUserCoinsWallet( token), { keepPreviousData: true})
    return result
}


export const getUserStats = cache(async(url: string, token?: string) => {
  try {
      axiosAPI.accessToken = token
      const result = await axiosAPI.get(url)
      return result.data as CurrUserStats
  } catch (error) {
      throw error
  }
})

export const useUserStats = (id: string, token?: string) => {
  const result = useSWR([`/v1/users/${id}/stats`, token], ([url, token]) => getUserStats(url, token), { keepPreviousData: true})
  return result.data
}

export const getSWRTxnHistory = cache(async (
      url: string,
    ): Promise<{data: Transaction[], nextCursor: string}> => {
        try {
          let res: AxiosResponse = await axiosAPI.get(url);
          const data = res.data as Transaction[]
          return { data, nextCursor: data[data.length - 1].id }
        } catch (error: any) {
          throw error;
        }
      }
  );


export const getTasks = cache(async (
  url: string,
): Promise<{data: Task[], nextCursor: string}> => {
    try {
      let res: AxiosResponse = await axiosAPI.get(url);
      const data = res.data as Task[]
      return { data, nextCursor: data[data.length - 1].id }
    } catch (error: any) {
      throw error;
    }
  }
);


export const getUserTaskSettings = cache(async (
  url: string,
  token?: string,
): Promise<{id: string, userId: string, dailyBonusDate: string, adsBonusDate: string, createdAt: string, updateAt: string}> => {
    axiosAPI.accessToken = token
    try {
      let res: AxiosResponse = await axiosAPI.get(url);
      return res.data
    } catch (error: any) {
      throw error;
    }
  }
);

export const useCurrentAuthUser = (token?: string) => {
  const result = useSWR(['/current-user', token], ([_, token]) => getAuthUser( token), { keepPreviousData: true})
  return result
}