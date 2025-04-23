import { axiosAPI } from "@/config/axios";
import { RewardTypeEnum } from "@/types";

export const createNewTask = async(body:{
    title: string;
    description: string;
    code?: string;
    url: string;
    reward: number;
    rewardType: RewardTypeEnum;
}, accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.post(`/v1/tasks`, body)
        return result.data
    } catch (error: any) {
        throw error
    }
}

export const rewardTask = async(arg: {id: string, code?: string | null}, accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.post(`/v1/wallets/daily-task`, arg)
        return result.data
    } catch (error: any) {
        throw error
    }
}