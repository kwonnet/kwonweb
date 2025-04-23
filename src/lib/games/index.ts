import { axiosAPI } from "@/config/axios";
import { GameArchiveUser, GameCategoryRanking, GameRankingArchiveStats, GameRoomRankingEnum, GameWinner, GameWinnersStats, UserCategoryRanking } from "@/types";
import { composeUrlQuery } from "@/utils";
import { cache } from "react";

export const getGamePlayerRankings = async(params: { userId: string, rankType: GameRoomRankingEnum}, token?: string) => {
    try {
        axiosAPI.accessToken = token
        const queryString = composeUrlQuery(params)
        const result = await axiosAPI.get(`/v1/games/users/${params.userId}/rankings?${queryString}`)
        return result.data as UserCategoryRanking[]
    } catch (error: any) {
        throw error
    }
}

export const getGameWinnersStats = cache(async(token?: string) => {
    try {
        axiosAPI.accessToken = token
        const result = await axiosAPI.get(`/v1/games/winners/stats`)
        console.log(result.data)
        return result.data as GameWinnersStats[]
    } catch (error: any) {
        throw error
    }
})

export const getGameWinners = cache(async(query: string, token?: string) => {
    try {
        axiosAPI.accessToken = token
        const result = await axiosAPI.get(`/v1/games/winners?${query}`)
        return result.data as GameWinner[]
    } catch (error: any) {
        throw error
    }
})

export const getGameCategoriesRankings = async(params: {rankType: GameRoomRankingEnum}, token?: string) => {
    try {
        axiosAPI.accessToken = token
        const queryString = composeUrlQuery(params)
        const result = await axiosAPI.get(`/v1/games/categories/rankings?${queryString}`)
        return result.data as GameCategoryRanking[]
    } catch (error: any) {
        console.log(error)
        throw error
    }
}

export const getGameRankingArchiveStats = cache(async(token?: string) => {
    try {
        axiosAPI.accessToken = token
        const result = await axiosAPI.get(`/v1/games/categories/ranking-archive/stats`)
        return result.data as GameRankingArchiveStats[]
    } catch (error: any) {
        throw error
    }
})

export const getGameCategoryRankingArchive = cache(async(query: string, token?: string) => {
    try {
        axiosAPI.accessToken = token
        const result = await axiosAPI.get(`/v1/games/categories/ranking-archive?${query}`)
        return result.data as GameArchiveUser[]
    } catch (error: any) {
        throw error
    }
})



export const getUserGameRankingArchiveStats = cache(async(userId: string, token?: string) => {
    try {
        axiosAPI.accessToken = token
        const result = await axiosAPI.get(`/v1/games/users/${userId}/ranking-archive/stats`)
        return result.data as GameRankingArchiveStats[]
    } catch (error: any) {
        throw error
    }
})

export const getUserGameRankingArchiveData = cache(async({userId, query}:{userId: string,query: string}, token?: string) => {
    try {
        axiosAPI.accessToken = token
        const result = await axiosAPI.get(`/v1/games/users/${userId}/ranking-archive?${query}`)
        return result.data as GameArchiveUser
    } catch (error: any) {
        throw error
    }
})