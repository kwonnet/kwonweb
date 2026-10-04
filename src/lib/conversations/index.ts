import { axiosAPI } from "@/config/axios"
import { Conversation, ConvoKind, DecryptedChatMessage, DecryptedConversation, EncryptedChatMessage, EncryptedConversation } from "@/types/conversation"
import { ChatDevice, DeviceBundle } from "@/types/sodium"

import { UserStats } from "@/types/user"
import { composeUrlQuery } from "@/utils"



export const createConversation = async(body: {senderId: string, recipientId: string, kind: ConvoKind}, accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.post("/v1/conversations", body)
        return result.data as Conversation
    } catch (error: any) {
        throw error
    }
}

export const getUserChatDevices = async(userId: string, accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.get(`/v1/conversations/users/${userId}/devices`)
        return result.data as ChatDevice[]
    } catch (error: any) {
        throw error
    }
}

export const decryptChatMessages = async(localUserId: string, localDeviceId: string, messages: EncryptedChatMessage[]) => {
    const { decryptIncomingMessage } = await import("../sodium");
    return await Promise.all(messages.map(async(body) => {
        let content = null
        try {
            content = await decryptIncomingMessage({body, localUserId, localDeviceId})
        } catch (error) {
            
        }
        const { ciphertext, nonce, header, ...rest } = body
        const decrypt: DecryptedChatMessage =  { ...rest, content}
        return decrypt
    }))
}


export const getConversationMessages = async(query: {convoId: string; userId: string}, accessToken?: string)=> {
    try {
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.get(`/v1/conversations/${query.convoId}/messages`)
        const data = result.data as {messages: EncryptedChatMessage[], nextCursor?: string | null}
        console.log("Encrypted messages ", data)
        const localDeviceId = `d_${query.userId?.slice(-10)}`
        return await decryptChatMessages(query.userId, localDeviceId, data.messages)
    } catch (error: any) {
        throw error
    }
}

export const getUserChatConversations = async(args:{userId: string; kind: string; page: number, limit: number}, accessToken?: string)=> {
    try {
        const { userId, ...rest } = args
        const query = composeUrlQuery(rest)
        axiosAPI.accessToken = accessToken
        const result = await axiosAPI.get(`/v1/conversations/users/${userId}/conversations?${query}`)
        const localDeviceId = `d_${userId?.slice(-10)}`
        const data: EncryptedConversation[] = result.data
        const conversations: DecryptedConversation[] = await Promise.all(data.map(async({lastMessage, ...rest}) => {
            if(lastMessage){
                const decrypt = await decryptChatMessages(userId, localDeviceId, [lastMessage])
                return {...rest, lastMessage: decrypt[0]}
            }
            return rest
        }))
        return conversations
    } catch (error: any) {
        throw error
    }
}

export const updateUserConversations = async(body: {userId: string, convoId?: string; isRead?: boolean; isSeen?: boolean}, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.patch(`/v1/conversations/users/${body.userId}/conversations`, body );
    return result.data
  } catch (error: any) {
    throw error
  }
}