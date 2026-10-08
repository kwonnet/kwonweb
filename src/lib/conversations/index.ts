import {axiosAPI} from '@/config/axios';
import type {Conversation,DecryptedConversation} from '@/types/conversation';
import {composeUrlQuery} from '@/utils';
export async function createConversation(body: {recipientId:string},accessToken?:string) {
  axiosAPI.accessToken=accessToken;
  return (await axiosAPI.post('/v1/conversations',body)).data as Conversation;
}
const pendingLists = new Map<string, Promise<DecryptedConversation[]>>();
export function getUserChatConversations(args:{userId:string;kind:string;page:number;limit:number},accessToken?:string):Promise<DecryptedConversation[]> {
  const {userId,kind,page,limit}=args;
  const key=JSON.stringify([userId,kind,page,limit,accessToken]);
  const pending=pendingLists.get(key); if(pending) return pending;
  axiosAPI.accessToken=accessToken;
  const request=axiosAPI.get(`/v1/conversations/users/${userId}/conversations?${composeUrlQuery({kind,page,limit})}`).then(response=>response.data as DecryptedConversation[]);
  pendingLists.set(key,request);
  void request.finally(()=>pendingLists.delete(key)).catch(()=>{});
  return request; // Metadata first; the shared provider catches up and decrypts previews.
}
