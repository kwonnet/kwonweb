import { axiosAPI } from "@/config/axios";
import { TxnCurrencyEnum } from "@/types"
import { getErrorMessage } from "@/utils"

export const purchaseCoins = async(payload: { packageId: string,
    currency: TxnCurrencyEnum, meta?: object}, accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.post("/v1/coins/purchase", payload)
        return { data: result.data, message: "Coins purchased successfully" }
    } catch (error: any) {
        return { data: null, message: getErrorMessage(error)}
    }
}


export const transferCoins = async(payload: { senderId: string, recipientId: string,
    amount: number,}, accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.post("/v1/wallets/transfer", payload)
        return { data: result.data, message: "Coins transfered successfully" }
    } catch (error: any) {
        return { data: null, message: getErrorMessage(error)}
    }
}

export const withdrawCoins = async(payload: {amount: number,}, accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.post("/v1/wallets/withdraw", payload)
        return { data: result.data, message: "Withdrawal successful" }
    } catch (error: any) {
        return { data: null, message: getErrorMessage(error)}
    }
}