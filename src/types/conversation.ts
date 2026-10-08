import type {UserPublic} from './user';
import type {LocalMessage,MessagingWire} from '@/lib/signal/contracts';
interface Participant {
  id: string;
  acceptedAt?: string | null;
  isPaid: boolean;
  user: UserPublic;
}
export enum ConvoKind { CHAT = 'chat' }
export interface Conversation {
  id: string;
  state: 'PENDING_REQUEST' | 'ACCEPTED';
  epoch: number;
  kind: ConvoKind;
  initiator: Participant;
  responder: Participant;
  unreadCount: number;
  unseenCount: number;
  createdAt: string;
  updatedAt: string;
}
// HTTP list metadata and client-decrypted summaries have distinct types.
export type EncryptedConversation = Conversation;
export interface DecryptedConversation extends Conversation {lastMessage?: LocalMessage}
export type EncryptedChatMessage = MessagingWire;
export type DecryptedChatMessage = LocalMessage;
