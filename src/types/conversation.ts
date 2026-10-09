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
  requestMessageSent?: boolean;
  kind: ConvoKind;
  initiator: Participant;
  responder: Participant;
  unreadCount: number;
  unseenCount: number;
  createdAt: string;
  updatedAt: string;
  lastSequence?: string;
}
// Relay sync carries membership metadata, not the profiles returned by the inbox.
export type ConversationMetadata = Omit<Conversation, 'initiator' | 'responder'> & {
  initiator: Omit<Participant, 'user'>;
  responder: Omit<Participant, 'user'>;
};
// HTTP list metadata and client-decrypted summaries have distinct types.
export type EncryptedConversation = Conversation;
export interface DecryptedConversation extends Conversation {lastMessage?: LocalMessage; previewLoading?: boolean}
export type EncryptedChatMessage = MessagingWire;
export type DecryptedChatMessage = LocalMessage;
