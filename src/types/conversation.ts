import { UserPublic } from "./user";

interface ConvoParticipant {
    id: string;
    archivedAt?: string | null;
    deletedAt?: string | null;
    acceptedAt?: string | null
    isPaid: boolean;
    user: UserPublic;
}

export enum ConvoKind {
    CHAT = "chat",
    ANONYMOUS = "anonymous"
}

export interface Conversation {
  id: string;
  kind: ConvoKind,
  initiator: ConvoParticipant
  responder: ConvoParticipant
  unreadCount: number;
  unseenCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedConversation extends Conversation {
    lastMessage?: EncryptedChatMessage
}

export interface DecryptedConversation extends Conversation {
    lastMessage?: DecryptedChatMessage
}

interface ParticipantDelete {
  userId: string;
  deletedAt: Date;
}

interface ChatSeen {
  userId: string;
  seenAt: string;
}

interface ChatRead {
  userId: string;
  readAt: string;
}

interface ChatReaction {
  userId: string;
  reaction: string;
  reactedAt?: Date;
}

interface ChatMessage {
  id: string;
  conversation: string;
  fromUserId: string;
  fromDeviceId: string;
  toUserId: string;
  toDeviceId: string;
  sender?: UserPublic;
  deletedFor: ParticipantDelete[];
  deletedAt?: Date;
  seen: ChatSeen[];
  read: ChatRead[];
  reactions: ChatReaction[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface EncryptedChatMessage extends ChatMessage {
  ciphertext: string;
  nonce: string;
  header: {
    dhPub_b64: string; // base64 of sender's DH public key for this message (X25519)
    pn: number; // previous chain length
    n: number; // message number within sending chain
  }; // Double Ratchet header
  meta?: { [key: string]: string };
}

export interface DecryptedChatMessage extends ChatMessage {
  content?: string | null;
  meta?: { [key: string]: string };
}


