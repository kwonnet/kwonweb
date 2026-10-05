import {apiUrl} from '@/config';
import {prepareWalletIntent,completeWalletIntent} from '@/utils/wallet-intents';
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
export type EngagementTask = {id:string;action:string;title:string;target:number;reward:number;enabled:boolean;progress:number;eligible:boolean;nextClaimAt:string|null;rewardDay:string};
export async function getEngagementTasks(token:string): Promise<EngagementTask[]> {
 const response=await fetch(`${apiUrl}/tasks/engagement`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok) throw new Error('Unable to load tasks.');
 return response.json();
}
export async function checkEngagementTask(id:string,userId:string,token:string) {
 const route=`/tasks/engagement/${encodeURIComponent(id)}/claim`;
 const intent=await prepareWalletIntent(userId,route,{},window.sessionStorage);
 const response=await fetch(`${apiUrl}${route}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Idempotency-Key':intent.key},signal:AbortSignal.timeout(20000)});
 const result=await response.json().catch(()=>null);
 if(response.ok || [400,404,409,422].includes(response.status)) completeWalletIntent(intent.slot,intent.key,window.sessionStorage);
 if(!response.ok) throw new Error(result?.error||'Unable to confirm your reward. Retry to safely check the same request.');
 return result as {reward:number;nextClaimAt:string;message:string};
}
export async function configureEngagementTask(id:string,input:{enabled?:boolean;target?:number},token:string) {
 const response=await fetch(`${apiUrl}/tasks/engagement/${encodeURIComponent(id)}`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(input)});
 if(!response.ok) throw new Error('Unable to change task settings.');
}
