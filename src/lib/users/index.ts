import { axiosAPI } from "@/config/axios";
import { GameAchievement, ReportReasonCode, Subscription } from "@/types"
import { UserConnection, UserMiniProfile } from "@/types/user";
import { composeUrlQuery, getErrorMessage } from "@/utils"
import { cache } from "react";

type SearchUser = {
    id: string
    username: string
    avatar: string
    name: string
}

export const searchUser = async(query: string, accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.post("/v1/users/search", {query })
        return { data: result.data, message: "success" }
    } catch (error: any) {
        return { data: null, message: getErrorMessage(error)}
    }
}

export const searchUsers = cache(async(args: {query: string, page?: number, limit?: number}, accessToken?: string)=> {
    try {
        let url = `/v1/users/search?q=${args.query}`
        if(args.page){
            url = `${url}&page=${args.page}`
        }
        if(args.limit){
            url = `${url}&limit=${args.limit}`
        }
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.get(url)
        return result.data as SearchUser[]
    } catch (error: any) {
        throw error
    }
})

export const getUserAchievements = async(args:{limit: number, page: number, catId?: string | null, userId: string}, accessToken?: string)=> {
    try {
        const queryString = composeUrlQuery(args)
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.get(`/v1/users/${args.userId}/achievements?${queryString}`)
        return { 
            data: result.data as GameAchievement[], 
            nextCursor: result.data[result.data.length - 1].id 
        }
    } catch (error: any) {
        throw error
    }
}

export const getUserActiveSubscription = async(userId: string,accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.get(`/v1/users/${userId}/pro`)
        return result.data as Subscription
    } catch (error: any) {
        throw error
    }
}

export const updateUserFollower = async(args: { senderId: string, recipientId: string}, accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.post("/v1/users/follows", args)
        return { data: result.data, message: "success" }
    } catch (error: any) {
        return { data: null, message: getErrorMessage(error)}
    }
}

export const blockUser = async (id: string, accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.post(`/v1/users/${id}/block`, { id });
      return result.data as { id: string, blockerId: string, blockedId: string, isBlocked: true};
    } catch (error: any) {
      throw error
    }
  }

  export const muteUser = async (id: string, accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.post(`/v1/users/${id}/mute`, { id });
      return result.data as { id: string, muterId: string, mutedId: string, isMuted: true};
    } catch (error: any) {
      throw error
    }
  }

export const reportUser = async (body: {code: ReportReasonCode, id: string, message?: string, meta: { title: string, description: string, code: ReportReasonCode }}, accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.post(`/v1/users/${body.id}/reports`, body);
      return { data: result.data, message: "User reported successfully" };
    } catch (error: any) {
      return { data: null, message: getErrorMessage(error) }
    }
  }



export const getSuggestedConnections = cache(async(args:{limit: number, type?: string, page?: number}, accessToken?: string)=> {
    try {
        const queryString = composeUrlQuery(args)
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.get(`/v1/users/connections?${queryString}`)
        return result.data as UserConnection[]
    } catch (error: any) {
        throw error
    }
})

export const logUserLocation = async(body:{latitude: number, longitude: number}, accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.post(`/v1/users/locations`, body )
        return result.data 
    } catch (error: any) {
        throw error
    }
}

export const trackUserProfileVisit = async(body:{userId: string, sessionId: string; postId?: string}, accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.post(`/v1/users/${body.userId}/visitors`, body )
        return result.data 
    } catch (error: any) {
        throw error
    }
}


export const getUserOverview = cache(async(identifier: string, accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.get(`/v1/users/${identifier}/overview`)
        return result.data as UserMiniProfile
    } catch (error: any) {
        throw error
    }
})