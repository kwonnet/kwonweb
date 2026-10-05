import { apiUrl } from "@/config";
import { axiosAPI } from "@/config/axios";
import { AppNotification, FeedPost, GameAchievement, ReportReasonCode, Subscription } from "@/types"
import { EncryptedConversation } from "@/types/conversation";
import { FollowAction, UserAccountStatus, UserConnection, UserMiniProfile, UserStats } from "@/types/user";
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

export const searchUsers = async(args: {query: string, page?: number, limit?: number}, accessToken?: string) => {
  const response = await fetch(`${apiUrl}/users/search?${new URLSearchParams({ q: args.query, page: String(args.page ?? 1), limit: String(args.limit ?? 21) })}`, {
    cache: 'no-store', headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}, signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error('Unable to search people. Please try again.');
  const people = await response.json() as { id: string; name: string; username: string; avatar: string | null; bio: string | null }[];
  return people.map(person => ({ ...person, avatar: person.avatar ?? "" }));
};

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

export const updateUserFollower = async(args: { senderId: string, recipientId: string, action: FollowAction}, accessToken?: string)=> {
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


export const getUserConnections = cache(async (args:{userId: string, slug: string; limit: number, page?: number}, accessToken?: string) => {
  try {
    const queryString = composeUrlQuery(args)
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.get(`/v1/users/${args.userId}/${args.slug}?${queryString}`);
    return result.data as UserConnection[];
  } catch (error: any) {
    throw error
  }
})


export const getUserPostsFeed = cache(async (args: {kind: string, userId: string, limit: number, page?: number}, accessToken?: string) => {
  const query = new URLSearchParams({limit: String(args.limit), page: String(args.page ?? 1)});
  const response = await fetch(`${apiUrl}/users/${encodeURIComponent(args.userId)}/${encodeURIComponent(args.kind)}?${query}`, {
    cache: 'no-store',
    headers: accessToken ? {Authorization: `Bearer ${accessToken}`} : {},
    signal: AbortSignal.timeout(15_000),
  });
  // The existing API returns 404 for an empty profile page.
  if (response.status === 404) return [] as FeedPost[];
  if (!response.ok) throw new Error('Unable to load profile posts. Please try again.');
  return await response.json() as FeedPost[];
});


export const updateAccountState = async (body: {userId: string; status: UserAccountStatus}, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.post(`/v1/users/${body.userId}/update-account-status`, body );
    return result.data as { userId: string, isActive: boolean};
  } catch (error: any) {
    throw error
  }
}

// export const getUserNotificationStats = cache(async(userId: string, accessToken?: string) => {
//   try {
//     axiosAPI.accessToken = accessToken;
//     const result = await axiosAPI.get(`/v1/users/${userId}/stats` );
//     return result.data as UserStats
//   } catch (error: any) {
//     throw error
//   }
// })

export const getUserNotifications = cache(async(args: {userId: string, page: number, limit: number}, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const queryString = composeUrlQuery(args)
    const result = await axiosAPI.get(`/v1/users/${args.userId}/notifications?${queryString}` );
    return result.data as AppNotification[]
  } catch (error: any) {
    throw error
  }
})

export const updateUserNotification = cache(async(body: {userId: string, isRead?: boolean; isSeen?: boolean}, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.patch(`/v1/users/${body.userId}/notifications`, body );
    return result.data as UserStats
  } catch (error: any) {
    throw error
  }
})



