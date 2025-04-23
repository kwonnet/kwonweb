import { axiosAPI } from "@/config/axios";
import { BonusTypeEnum, Wallet } from "@/types"
import { getErrorMessage } from "@/utils"
import { cache } from "react"

export const getTonProofToken = async(accessToken?: string) => {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.get("/v1/wallets/proof" )
        return { data: result.data, message: "Token retrieved"}
    } catch (error: any) {
        return { data: null, message: getErrorMessage(error) }
    }
}


export const saveUserWalletAddress = async(params: {name: string, address: string, token: string }, accessToken?: string):Promise<{data: any | null, message: string}> => {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.post("/v1/wallets/addresses", params )
        return { data: result.data, message: "Your wallet was successfully linked to your account"}
    } catch (error: any) {
        return { data: null, message: getErrorMessage(error)}
    }
}

export const getUserCoinsWallet = cache(async(accessToken?: string):Promise<Wallet> => {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.get("/v1/wallets")
        return result.data
    } catch (error: any) {
        throw error
    }
})

export const claimDailyBonus = async(args: { amount: number, date: string, type: BonusTypeEnum }, accessToken?: string):Promise<{data: any | null, message: string}> => {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.post("/v1/wallets/daily-bonus", args )
        return { data: result.data, message: "Success"}
    } catch (error: any) {
        return { data: null, message: getErrorMessage(error)}
    }
}