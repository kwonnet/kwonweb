import {axiosAPI} from '@/config/axios';
import type {Conversation,DecryptedConversation} from '@/types/conversation';
import {composeUrlQuery} from '@/utils';
export async function createConversation(body: {recipientId:string},accessToken?:string) {
  axiosAPI.accessToken=accessToken;
  return (await axiosAPI.post('/v1/conversations',body)).data as Conversation;
}
export async function getUserChatConversations(args:{userId:string;kind:string;page:number;limit:number},accessToken?:string):Promise<DecryptedConversation[]> {
  const {userId,...query}=args;
  axiosAPI.accessToken=accessToken;
  const data=(await axiosAPI.get(`/v1/conversations/users/${userId}/conversations?${composeUrlQuery(query)}`)).data as Conversation[];
  const {localConversation}=await import('./messaging');
  return Promise.all(data.map(async convo=>{
    const peer=convo.initiator.id===userId?convo.responder.id:convo.initiator.id;
    return {...convo,lastMessage:(await localConversation(userId,convo.id,peer)).at(-1)};
  }));
}
