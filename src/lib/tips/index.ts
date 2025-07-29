import { axiosAPI } from "@/config/axios"

export const getTipPackages = async(accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.get("/v1/tips")
        return result.data as {id: string, price: number, name: string, url?: string}[]
    } catch (error: any) {
        throw error
    }
}