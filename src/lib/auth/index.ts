'use client'
import { axiosAPI } from "@/config/axios";
import { User } from "@/types";

export const getAuthUser = async(token?: string) => {
    try {
          axiosAPI.accessToken = token
          const result = await axiosAPI.get(`/v1/auth/me`)
          return result.data as User
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
        return result.data as { user: User, token: string }
    } catch (error) {
        throw error
    }
}
