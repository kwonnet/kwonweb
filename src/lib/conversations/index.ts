import { axiosAPI } from "@/config/axios";
import { Conversation, ConvoKind, DecryptedChatMessage, DecryptedConversation, EncryptedChatMessage, EncryptedConversation } from "@/types/conversation";
import { ChatDevice, DeviceBundle } from "@/types/sodium";
import { UserStats } from "@/types/user";
import { composeUrlQuery } from "@/utils";
export const createConversation = async (body: {
    senderId: string;
    recipientId: string;
    kind: ConvoKind;
}, accessToken?: string) => {
    try {
        axiosAPI.accessToken = accessToken;
        const result = await axiosAPI.post("/v1/conversations", body);
        return result.data as Conversation;
    }
    catch (error: any) {
        throw error;
    }
};
export const getUserChatDevices = async (userId: string, accessToken?: string) => {
    try {
        axiosAPI.accessToken = accessToken;
        const result = await axiosAPI.get(`/v1/conversations/users/${userId}/devices`);
        return result.data as ChatDevice[];
    }
    catch (error: any) {
        throw error;
    }
};
export const decryptChatMessages = async (localUserId: string, localDeviceId: string, messages: EncryptedChatMessage[]) => {
    // Legacy ciphertext cannot be safely decrypted by the Signal v2 protocol.
    return messages.map(({ ciphertext, nonce, header, ...rest }) => ({ ...rest, content: null }));
};
export const getConversationMessages = async (query: {
    convoId: string;
    userId: string;
}, accessToken?: string) => {
    try {
        axiosAPI.accessToken = accessToken;
        const result = await axiosAPI.get(`/v1/conversations/${query.convoId}/messages`);
        const data = result.data as {
            messages: EncryptedChatMessage[];
            nextCursor?: string | null;
        };
        console.log("Encrypted messages ", data);
        const localDeviceId = `d_${query.userId?.slice(-10)}`;
        return await decryptChatMessages(query.userId, localDeviceId, data.messages);
    }
    catch (error: any) {
        throw error;
    }
};
export const getUserChatConversations = async (args: {
    userId: string;
    kind: string;
    page: number;
    limit: number;
}, accessToken?: string) => {
    try {
        const { userId, ...rest } = args;
        const query = composeUrlQuery(rest);
        axiosAPI.accessToken = accessToken;
        const result = await axiosAPI.get(`/v1/conversations/users/${userId}/conversations?${query}`);
        const data: EncryptedConversation[] = result.data;
        const { localConversation } = await import('./messaging');
        const conversations: DecryptedConversation[] = await Promise.all(data.map(async (convo) => {
            const peer = convo.initiator.id === userId ? convo.responder.id : convo.initiator.id;
            const messages = await localConversation(userId, convo.id, peer);
            const last = messages.at(-1);
            const { lastMessage: encryptedLast, ...rest } = convo;
            return { ...rest, ...(last ? { lastMessage: { ...last, deletedFor: [], updatedAt: last.createdAt } } : {}) };
        }));
        return conversations;
    }
    catch (error: any) {
        throw error;
    }
};
export const updateUserConversations = async (body: {
    userId: string;
    convoId?: string;
    isRead?: boolean;
    isSeen?: boolean;
}, accessToken?: string) => {
    try {
        axiosAPI.accessToken = accessToken;
        const result = await axiosAPI.patch(`/v1/conversations/users/${body.userId}/conversations`, body);
        return result.data;
    }
    catch (error: any) {
        throw error;
    }
};
