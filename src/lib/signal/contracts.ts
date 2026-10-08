import { z } from 'zod';
const id = z.string().uuid();
export const attachmentSchema = z.object({ v: z.literal(1), blobId: id, keyB64: z.string().max(48), ivB64: z.string().max(24), ciphertextSha256B64: z.string().max(48), ciphertextBytes: z.number().int().min(16).max(8388624), plaintextBytes: z.number().int().min(0).max(8388608), mime: z.enum(['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'audio/mpeg', 'application/pdf']), filename: z.string().max(200) }).strict();
const target = { targetId: id, targetHash: z.string().length(44) };
const content = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('text'), text: z.string().max(10000), reply: z.object(target).strict().optional() }).strict(),
    z.object({ kind: z.literal('media'), text: z.string().max(10000), attachments: z.array(attachmentSchema).min(1).max(10), reply: z.object(target).strict().optional() }).strict(),
    z.object({ kind: z.literal('reaction'), ...target, emoji: z.enum(['👍', '❤️', '😂', '😮', '😢', '🙏']), remove: z.boolean() }).strict(),
    z.object({ kind: z.literal('edit'), ...target, text: z.string().min(1).max(10000), revision: z.number().int().min(1) }).strict(),
    z.object({ kind: z.literal('delete'), ...target, signature: z.string().max(100) }).strict(),
]);
export const eventSchema = z.object({ v: z.literal(2), eventId: id, conversationId: id, senderId: z.string().min(1).max(100), senderDeviceId: id, createdAt: z.string().datetime(), content }).strict();
export type MessagingEvent = z.infer<typeof eventSchema>;
export type Content = MessagingEvent['content'];
export interface MessagingDevice {
    deviceId: string;
    userId: string;
    signalDeviceId: number;
    identityPublic: string;
    actionSigningPublic: string;
}
export interface MessagingWire {
    id: string;
    eventId: string;
    conversation: string;
    fromUserId: string;
    fromDeviceId: string;
    senderSignalDeviceId: number;
    senderActionSigningPublic: string;
    senderIdentityPublic: string;
    toUserId: string;
    toDeviceId: string;
    serverSequence: string;
    createdAt: string;
    wireType: 1 | 3;
    ciphertextB64: string;
    ownDevice?: boolean;
    seen: {
        userId: string;
        seenAt: string;
    }[];
    read: {
        userId: string;
        readAt: string;
    }[];
}
export interface LocalMessage extends MessagingWire {
    queued?: boolean;
    sendingState?: 'sending' | 'sent' | 'failed';
    pendingFilenames?: string[];
    integrityFailed?: boolean;
    event: MessagingEvent;
    content: string;
    hash: string;
    attachments?: z.infer<typeof attachmentSchema>[];
    reply?: {
        targetId: string;
        targetHash: string;
    };
    reactions: {
        userId: string;
        reaction: string;
    }[];
    deleted: boolean;
    revision: number;
}
export const deleteSigningBytes = (event: Pick<MessagingEvent, 'eventId' | 'conversationId' | 'senderId' | 'senderDeviceId' | 'createdAt'>, targetId: string, targetHash: string) => new TextEncoder().encode(JSON.stringify(['kwonnet-delete', 2, event.conversationId, event.eventId, event.senderId, event.senderDeviceId, event.createdAt, targetId, targetHash]));
