'use client';
import PasswordTextField from '@/components/common/PasswordTextField';
import MoreVert from '@mui/icons-material/MoreVert';
import MessagingHistoryTransfer from '@/components/common/MessagingHistoryTransfer';
import { createContext, useContext, useEffect, useLayoutEffect, useCallback, useRef, useState, type ReactNode } from 'react';
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, Paper, Stack, Typography, IconButton, Menu, MenuItem, Checkbox, FormControlLabel } from '@mui/material';
import { useAuthSession } from '@/hooks';
import { useSocketIoContext } from './SocketIoContext';
import { hasMessagingVault, unlockMessaging, restoreRememberedMessaging, forgetRememberedMessaging, lockMessaging, resetMessagingDevice, currentMessagingRuntime, signMessaging } from '@/lib/signal/deviceManager';
import { setMessagingSocket, syncMessages, resetLocalMessaging, enroll, decryptWire, localConversation, messagingAPI, flushMessagingOutbox, sendReceiptBatch, type SyncResult } from '@/lib/conversations/messaging';
import type { MessagingDevice, LocalMessage } from '@/lib/signal/contracts';
import { usePathname } from 'next/navigation';
import type { Conversation, ConversationMetadata } from '@/types/conversation';
import { getUserChatConversations } from '@/lib/conversations';
import { useSWRConfig } from 'swr';
export type InitialMessagingSync = { userId: string; deviceId: string; result: SyncResult };
type State = {
    convoSocketIo?: ReturnType<typeof useSocketIoContext>['convoSocketIo'];
    messages: LocalMessage[];
    ready: boolean;
    messagingRestoring?: boolean;
    messagingGate?: ReactNode;
    activeConversationId?: string;
    setActiveConversationId?: (id?: string) => void;
    viewportHeight?: number;
    revision: number;
    inboxRevision?: number;
    liveReady: boolean;
    refreshInbox: (conversationId?: string, totals?: { unreadCount?: number; unseenCount?: number; totalUnreadMsg?: number; totalUnseenMsg?: number }) => void;
    openOptions: (anchor: HTMLElement) => void;
    warmConversations: (conversations: Conversation[]) => void;
    loadingConversations: Record<string, boolean>;
    conversationUpdates?: Record<string, Partial<ConversationMetadata>>;
    receiptTotals: Record<string, { unreadCount: number; unseenCount: number }>;
    processed: {
        id: string;
        fromUserId: string;
        conversationId: string;
        eventId?: string;
        action: boolean;
    }[];
    refresh: (conversationId: string, peerId: string, initial?: InitialMessagingSync) => Promise<SyncResult | undefined>;
};
const Context = createContext<State>({ messages: [], ready: false, revision: 0, liveReady: false, processed: [], refresh: async () => undefined, refreshInbox: () => {}, receiptTotals: {}, openOptions: () => {}, warmConversations: () => {}, loadingConversations: {} });
export const useConvoSocketIoContext = () => useContext(Context);
export function MessagingOptionsButton() {
    const { openOptions } = useConvoSocketIoContext();
    return <IconButton aria-label="Messaging options" onClick={event => openOptions(event.currentTarget)}><MoreVert /></IconButton>;
}
export default function ConvoSocketIoProvider({ children }: {
    children: ReactNode;
}) {
    const pathname = usePathname() ?? '';
    const messagingPage = pathname.startsWith('/messages');
    const [selectedConversationId, setActiveConversationId] = useState<string>();
    const [pageVisible, setPageVisible] = useState(true);
    useEffect(() => {
        const update = () => setPageVisible(document.visibilityState === 'visible');
        update();
        document.addEventListener('visibilitychange', update);
        return () => document.removeEventListener('visibilitychange', update);
    }, []);
    const [remember, setRemember] = useState(false), [restoring, setRestoring] = useState(true);
    const previousUser = useRef('');
    const [loadingConversations, setLoadingConversations] = useState<Record<string, boolean>>({});
    const warmQueue = useRef(new Map<string, string>()), warmWorkers = useRef(0);
    const knownConversations = useRef(new Map<string, { peerId: string; stamp: string }>());
    const { user, token: authToken } = useAuthSession();
    const token = authToken ?? '';
    const userId = user?.id ?? '';
    const { convoSocketIo } = useSocketIoContext();
    const { mutate } = useSWRConfig();
    const [conversationUpdates, setConversationUpdates] = useState<Record<string, Partial<ConversationMetadata>>>({});
    const [receiptTotals, setReceiptTotals] = useState<Record<string, { unreadCount: number; unseenCount: number }>>({});
    const [optionsAnchor, setOptionsAnchor] = useState<HTMLElement | null>(null);
    const [viewportHeight, setViewportHeight] = useState<number>();
    useEffect(() => {
        const resize = () => setViewportHeight(window.visualViewport ? window.visualViewport.height + window.visualViewport.offsetTop : window.innerHeight);
        resize();
        window.visualViewport?.addEventListener('resize', resize);
        window.visualViewport?.addEventListener('scroll', resize);
        window.addEventListener('resize', resize);
        return () => { window.visualViewport?.removeEventListener('resize', resize); window.visualViewport?.removeEventListener('scroll', resize); window.removeEventListener('resize', resize); };
    }, []);
    const [ready, setReady] = useState(false), [existing, setExisting] = useState(false), [passphrase, setPassphrase] = useState(''), [confirmation, setConfirmation] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [processed, setProcessed] = useState<{
        id: string;
        fromUserId: string;
        conversationId: string;
        eventId?: string;
        action: boolean;
    }[]>([]);
    const [liveReady, setLiveReady] = useState(false);
    const [devices, setDevices] = useState<MessagingDevice[]>([]), [showDevices, setShowDevices] = useState(false);
    const [messages, setMessages] = useState<LocalMessage[]>([]), [revision, setRevision] = useState(0);
    const [inboxRevision, setInboxRevision] = useState(0);
    const activeConversationId = messagingPage && !pathname.split('/').includes('list') && pageVisible && ready && !restoring ? selectedConversationId : undefined;
    const activeConversation = useRef<string | undefined>(undefined);
    useLayoutEffect(() => { activeConversation.current = activeConversationId; }, [activeConversationId]);
    const inboxSeeded = useRef(false);
    const initialSyncs = useRef(new Map<string, InitialMessagingSync>());
    const inFlight = useRef(new Map<string, Promise<SyncResult | undefined>>());
    const generation = useRef(0);
    const dirty = useRef(new Set<string>());
    const refreshInbox = useCallback((conversationId?: string, totals?: { unreadCount?: number; unseenCount?: number; totalUnreadMsg?: number; totalUnseenMsg?: number }) => {
        if (conversationId && typeof totals?.unreadCount === 'number' && typeof totals?.unseenCount === 'number') {
            setReceiptTotals(previous => ({ ...previous, [conversationId]: { unreadCount: totals.unreadCount!, unseenCount: totals.unseenCount! } }));
        }
        setRevision(value => value + 1);
        if (!conversationId || !totals) setInboxRevision(value => value + 1);
        // Receipts have already committed; refresh authoritative totals directly,
        // including when the socket hint is delayed or HTTP fallback was used.
        const statsKey = (key: unknown) => Array.isArray(key) && key[0] === `/v1/users/${userId}/stats`;
        if (typeof totals?.totalUnreadMsg === 'number' && typeof totals?.totalUnseenMsg === 'number') {
            void mutate(statsKey, (current: any) => current ? { ...current, totalUnreadMsg: totals.totalUnreadMsg, totalUnseenMsg: totals.totalUnseenMsg } : current, { revalidate: false }).catch(() => {});
        } else void mutate(statsKey).catch(() => {});
    }, [mutate, userId]);
    useEffect(() => {
        const previous = previousUser.current;
        previousUser.current = userId;
        if (previous && previous !== userId) void forgetRememberedMessaging(previous);
        generation.current++; lockMessaging(); setReady(false); setMessages([]); setProcessed([]); setReceiptTotals({}); setConversationUpdates({}); setActiveConversationId(undefined);
        inboxSeeded.current = false; initialSyncs.current.clear(); knownConversations.current.clear(); warmQueue.current.clear(); warmWorkers.current = 0; inFlight.current.clear(); setLoadingConversations({}); setPassphrase(''); setConfirmation(''); setRestoring(true);
        const epoch = generation.current;
        if (userId) void (async () => {
            try {
                const exists = await hasMessagingVault(userId);
                if (epoch !== generation.current) return;
                setExisting(exists);
                const restored = await restoreRememberedMessaging(userId);
                if (restored) {
                    await enroll(userId, token);
                    if (epoch === generation.current) { setReady(true); setRemember(true); }
                }
            } catch { if (epoch === generation.current) lockMessaging(); }
            finally { if (epoch === generation.current) setRestoring(false); }
        })();
        else setRestoring(false);
        return () => { generation.current++; lockMessaging(); };
    }, [userId]);
    const unlock = async () => {
        setBusy(true);
        setError('');
        const epoch = generation.current;
        try {
            if (!existing && passphrase !== confirmation)
                throw new Error('Passphrases do not match');
            await unlockMessaging(userId, passphrase, remember);
            await enroll(userId, token);
            if (epoch !== generation.current) {
                lockMessaging();
                return;
            }
            setReady(true);
            setPassphrase('');
            setConfirmation('');
            setExisting(true);
        }
        catch (e) {
            lockMessaging();
            setError(e instanceof Error ? e.message : 'Unable to unlock messaging');
        }
        finally {
            setBusy(false);
        }
    };
    const refresh = useCallback((conversationId: string, peerId: string, initial?: InitialMessagingSync) => {
        // Direct links can open chats beyond the currently loaded inbox pages.
        // Register them so targeted socket hints still sync the mounted conversation.
        if (!knownConversations.current.has(conversationId)) knownConversations.current.set(conversationId, { peerId, stamp: '' });
        if (initial) initialSyncs.current.set(conversationId, initial);
        const prior = inFlight.current.get(conversationId);
        if (prior) {
            dirty.current.add(conversationId);
            return prior;
        }
        const epoch = generation.current;
        setLoadingConversations(previous => ({ ...previous, [conversationId]: true }));
        const work = (async () => {
            if (!ready)
                return;
            const r = currentMessagingRuntime(userId);
            const publishCache = async () => {
                const local = await localConversation(userId, conversationId, peerId);
                if (epoch !== generation.current) return;
                setMessages(previous => {
                    const cached = previous.filter(message => message.conversation === conversationId);
                    const byId = new Map(cached.map(message => [message.id, message]));
                    const next = local.map(message => {
                        const prior = byId.get(message.id);
                        return prior && JSON.stringify(prior) === JSON.stringify(message) ? prior : message;
                    });
                    if (cached.length === next.length && cached.every((message, index) => message === next[index])) return previous;
                    return previous.filter(message => message.conversation !== conversationId).concat(next);
                });
                const processedMessages = await r.vault.atomic(async draft => Object.entries(draft.records).filter(([key]) => key.startsWith('wire:')).map(([, value]) => JSON.parse(value)).filter(wire => wire.conversation === conversationId && !draft.records[`failed:${wire.id}`] && new Date(wire.createdAt).getTime() > Date.now() - 90 * 86400000 && !(JSON.parse(draft.records[`hidden:${conversationId}`] ?? '[]') as string[]).includes(wire.id)).map(wire => ({ id: wire.id, fromUserId: wire.fromUserId, conversationId, eventId: wire.eventId, action: !['text','media'].includes(JSON.parse(draft.records[`event:${wire.eventId}`]).content.kind) })));
                if (epoch === generation.current) setProcessed(previous => {
                    const cached = previous.filter(message => message.conversationId === conversationId);
                    return JSON.stringify(cached) === JSON.stringify(processedMessages) ? previous : previous.filter(message => message.conversationId !== conversationId).concat(processedMessages);
                });
            };
            await publishCache(); // Render cached messages before any relay or outbox work.
            void flushMessagingOutbox(userId, token).catch(() => {});
            let cursor = await r.vault.atomic(async (draft) => draft.records[`cursor:${conversationId}`] ?? '0');
            let receiptCursor = await r.vault.atomic(async (draft) => draft.records[`receipt-cursor:${conversationId}`] ?? '0');
            let result: SyncResult | undefined;
            do {
                dirty.current.delete(conversationId);
                try {
                    const seed = initialSyncs.current.get(conversationId);
                    initialSyncs.current.delete(conversationId);
                    const validSeed = seed?.userId === userId && seed.deviceId === r.deviceId && seed.result.conversation.id === conversationId && cursor === '0' && receiptCursor === '0';
                    result = validSeed ? seed!.result : await syncMessages(userId, token, conversationId, cursor, receiptCursor);
                }
                catch (error) {
                    if (epoch === generation.current) {
                        const cached = await localConversation(userId, conversationId, peerId);
                        if (epoch === generation.current) setMessages(previous => previous.filter(message => message.conversation !== conversationId).concat(cached));
                    }
                    throw error;
                }
                for (const wire of result.messages) {
                    try {
                        await decryptWire(userId, wire);
                    }
                    catch {
                        await r.vault.atomic(async (draft) => { draft.records[`failed:${wire.id}`] = JSON.stringify(wire); });
                        setError('An encrypted message could not be authenticated. Verify device identities with your contact.');
                    }
                }
                // Receipt state and catch-up cursor persist only after every envelope in this page commits.
                await r.vault.atomic(async (draft) => {
                    for (const receipt of result!.receipts) {
                        // A receipt can arrive before its message page. Persist it independently
                        // so advancing the receipt cursor never loses delivery/read state.
                        const receiptKey = `receipt:${receipt.id}:${receipt.userId}`;
                        const prior = JSON.parse(draft.records[receiptKey] ?? 'null');
                        draft.records[receiptKey] = JSON.stringify({ ...receipt, conversationId, readAt: receipt.readAt ?? prior?.readAt ?? null });
                        for (const [key, value] of Object.entries(draft.records)) {
                            if (!key.startsWith('wire:'))
                                continue;
                            const wire = JSON.parse(value);
                            if (wire.id !== receipt.id)
                                continue;
                            wire.seen = wire.seen.filter((v: any) => v.userId !== receipt.userId);
                            wire.seen.push({ userId: receipt.userId, seenAt: receipt.deliveredAt });
                            if (receipt.readAt) {
                                wire.read = wire.read.filter((v: any) => v.userId !== receipt.userId);
                                wire.read.push({ userId: receipt.userId, readAt: receipt.readAt });
                            }
                            draft.records[key] = JSON.stringify(wire);
                        }
                    }
                    draft.records[`cursor:${conversationId}`] = result!.nextCursor;
                    draft.records[`receipt-cursor:${conversationId}`] = result!.nextReceiptCursor;
                });
                cursor = result.nextCursor;
                receiptCursor = result.nextReceiptCursor;
                knownConversations.current.set(conversationId, { peerId, stamp: `${result.conversation.lastSequence ?? result.conversation.updatedAt}:${result.conversation.state}` });
                // Persist authenticated reads before publishing account totals. A message
                // in the open pane must never briefly appear in the navbar as unread.
                let totals: (Partial<ConversationMetadata> & { totalUnreadMsg?: number; totalUnseenMsg?: number }) | undefined = result.accountTotals ? { ...result.conversation, ...result.accountTotals } : undefined;
                if (result.conversation.state === 'ACCEPTED') {
                    const focused = activeConversation.current === conversationId && document.visibilityState === 'visible';
                    const ids = await r.vault.atomic(async draft => result!.messages.filter(wire => {
                        const receipt = JSON.parse(draft.records[`receipt:${wire.id}:${userId}`] ?? 'null');
                        return wire.fromUserId !== userId && !draft.records[`failed:${wire.id}`] && (focused ? !receipt?.readAt : !receipt);
                    }).map(wire => wire.id));
                    if (ids.length) {
                        try {
                            // Re-check after vault work so leaving the chat never sends a read.
                            const readNow = focused && activeConversation.current === conversationId && document.visibilityState === 'visible';
                            const acknowledged = await sendReceiptBatch(userId, token, conversationId, readNow ? [] : ids, readNow ? ids : []);
                            if (!acknowledged.suppressed) totals = { ...result.conversation, ...acknowledged };
                        } catch (error) { setError(error instanceof Error ? error.message : 'Delivery acknowledgement will retry'); }
                    }
                }
                if (epoch !== generation.current) return;
                const update = { ...result.conversation, ...totals };
                setConversationUpdates(previous => JSON.stringify(previous[conversationId]) === JSON.stringify(update) ? previous : { ...previous, [conversationId]: update });
                await publishCache();
                if (totals) refreshInbox(conversationId, totals);

            } while (result.messages.length === 100 || result.receipts.length === 100 || dirty.current.has(conversationId));
            return result;
        })();
        inFlight.current.set(conversationId, work);
        void work.finally(() => { if (inFlight.current.get(conversationId) === work) inFlight.current.delete(conversationId); if (epoch === generation.current) setLoadingConversations(previous => ({ ...previous, [conversationId]: false })); }).catch(() => { });
        return work;
    }, [ready, userId, token, refreshInbox]);
    const warmConversations = useCallback((conversations: Conversation[]) => {
        if (!ready) return;
        inboxSeeded.current = true;
        for (const conversation of conversations) {
            const peerId = conversation.initiator.id === userId ? conversation.responder.id : conversation.initiator.id;
            const stamp = `${conversation.lastSequence ?? conversation.updatedAt}:${conversation.state}`;
            if (knownConversations.current.get(conversation.id)?.stamp === stamp) continue;
            knownConversations.current.set(conversation.id, { peerId, stamp });
            warmQueue.current.set(conversation.id, peerId);
            setLoadingConversations(previous => ({ ...previous, [conversation.id]: true }));
        }
        const epoch = generation.current;
        const worker = async () => {
            warmWorkers.current++;
            try {
                while (epoch === generation.current && warmQueue.current.size) {
                    const [id, peerId] = warmQueue.current.entries().next().value!;
                    warmQueue.current.delete(id);
                    try { await refresh(id, peerId); }
                    catch { if (epoch === generation.current) knownConversations.current.delete(id); }
                }
            } finally { if (epoch === generation.current) warmWorkers.current--; }
        };
        while (warmWorkers.current < 2 && warmQueue.current.size) void worker();
    }, [ready, userId, refresh]);
    useEffect(() => {
        if (!ready || inboxSeeded.current) return;
        let cancelled = false;
        void getUserChatConversations({ userId, kind: 'chat', page: 1, limit: 21 }, token).then(conversations => { if (!cancelled) warmConversations(conversations); }).catch(() => {});
        return () => { cancelled = true; };
    }, [ready, userId, token, warmConversations]);
    useEffect(() => {
        if (!ready || !convoSocketIo)
            return;
        const bind = async (body: {
            challenge: string;
        }) => {
            try {
                const r = currentMessagingRuntime(userId);
                const signature = await signMessaging(new TextEncoder().encode(JSON.stringify(['kwonnet-device-bind', 1, body.challenge, userId, r.deviceId])));
                convoSocketIo.timeout(5000).emit('device:bind', { deviceId: r.deviceId, signature }, (error: Error | null, result: {
                    ok: boolean;
                }) => { if (error || !result?.ok) {
                    setLiveReady(false);
                    setMessagingSocket(userId);
                    return;
                } setMessagingSocket(userId, convoSocketIo); setLiveReady(true); setRevision(n => n + 1); });
            }
            catch {
                setError('Reconnect after unlocking messaging');
            }
        };
        // Request a new challenge too: connection may predate the vault unlock.
        convoSocketIo.on('device:challenge', bind);
        void enroll(userId, token).then(() => convoSocketIo.emit('device:challenge')).catch(() => setError('Device enrollment failed; unlock messaging again'));
        let hintTimer: ReturnType<typeof setTimeout> | undefined;
        const bindingEpoch = generation.current;
        const hinted = new Set<string>();
        const available = (hint?: { conversationId?: string }) => { if (hint?.conversationId) hinted.add(hint.conversationId); if (hintTimer)
            return; hintTimer = setTimeout(() => { hintTimer = undefined; let unknown = false; for (const id of hinted) { const known = knownConversations.current.get(id); if (known) void refresh(id, known.peerId).catch(() => {}); else unknown = true; } if (unknown) void getUserChatConversations({ userId, kind: 'chat', page: 1, limit: 21 }, token).then(conversations => { if (bindingEpoch === generation.current) warmConversations(conversations); refreshInbox(); }).catch(() => {}); hinted.clear(); }, 100); };
        const disconnected = () => { setMessagingSocket(userId); setLiveReady(false); };
        const connected = () => convoSocketIo.emit('device:challenge');
        convoSocketIo.on('connect', connected);
        convoSocketIo.on('disconnect', disconnected);
        convoSocketIo.on('message:available', available);
        return () => { clearTimeout(hintTimer); disconnected(); convoSocketIo.off('connect', connected); convoSocketIo.off('disconnect', disconnected); convoSocketIo.off('device:challenge', bind); convoSocketIo.off('message:available', available); };
    }, [ready, userId, token, convoSocketIo, refreshInbox, refresh, warmConversations]);
    const listDevices = async () => {
        try {
            setDevices(await messagingAPI<MessagingDevice[]>(userId, token, `/users/${userId}/devices`));
            setShowDevices(true);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to load devices');
        }
    };
    const revoke = async (id: string) => {
        try {
            await messagingAPI(userId, token, `/devices/${id}/revoke`, 'POST');
            if (id === currentMessagingRuntime(userId).deviceId) {
                generation.current++;
                lockMessaging();
                setReady(false);
                setMessages([]);
                await resetMessagingDevice(userId);
                setExisting(false);
            }
            else
                await listDevices();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to revoke device');
        }
    };
    let messagingGate: ReactNode;
    if (!userId && messagingPage)
        messagingGate = <Alert severity="info">Sign in to use encrypted messaging.</Alert>;
    else if (messagingPage && !restoring && !ready)
        messagingGate = <Box sx={{ p: 3, maxWidth: 600, maxHeight: '100%', overflowY: 'auto', mx: 'auto' }}><Paper sx={{ p: 3 }}><Stack spacing={2}><Typography variant="h5">{existing ? 'Unlock encrypted messages' : 'Set up encrypted messages'}</Typography><Typography>Your messaging passphrase protects keys on this browser. Use at least 12 characters. Keep it safe: resetting your account password cannot recover these messages.</Typography>{error && <Alert severity="error">{error}</Alert>}<PasswordTextField label="Messaging passphrase" value={passphrase} onChange={e => setPassphrase(e.target.value)} autoComplete={existing ? 'current-password' : 'new-password'}/>{!existing && <PasswordTextField label="Confirm messaging passphrase" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="new-password"/>}<FormControlLabel control={<Checkbox checked={remember} onChange={event => setRemember(event.target.checked)} />} label="Remember this private browser for 30 days" /><Typography variant="caption">Automatic unlock after sign-in on this browser. Anyone with access to this browser profile can access your local messages. Lock messages or sign out to forget it.</Typography><Button loading={busy} variant="contained" disabled={passphrase.length < 12} onClick={unlock}>{existing ? 'Unlock' : 'Set up messaging'}</Button>{existing && <Button color="warning" onClick={async () => {
                    if (!window.confirm('Remove this browser’s messaging keys and history? This cannot be undone. You will need a new device identity.'))
                        return;
                    try {
                        await resetLocalMessaging(userId, token);
                        setExisting(false);
                        setError('');
                    }
                    catch (e) {
                        setError(e instanceof Error ? e.message : 'Unable to reset local messaging');
                    }
                }}>Reset messaging on this browser</Button>}</Stack></Paper></Box>;
    return <Context.Provider value={{ convoSocketIo, messages, ready, activeConversationId, setActiveConversationId, messagingRestoring: restoring, messagingGate, viewportHeight, revision, inboxRevision, liveReady, processed, refresh, refreshInbox, conversationUpdates, receiptTotals, loadingConversations, warmConversations, openOptions: setOptionsAnchor }}>{messagingPage && ready && error && <Alert severity="error" sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 1300 }} onClose={() => setError('')}>{error}</Alert>}<Menu anchorEl={optionsAnchor} open={!!optionsAnchor} onClose={() => setOptionsAnchor(null)}><MenuItem onClick={() => { setOptionsAnchor(null); void listDevices(); }}>Messaging devices</MenuItem><MenuItem onClick={() => { setOptionsAnchor(null); generation.current++; lockMessaging(); setReady(false); setMessages([]); setProcessed([]); void forgetRememberedMessaging(userId).catch(() => setError('Unable to forget automatic unlock. Clear site storage before leaving a shared browser.')); }}>Lock messages</MenuItem></Menu><Dialog open={showDevices} onClose={() => setShowDevices(false)}><DialogTitle>Messaging devices</DialogTitle><DialogContent><Typography>Each browser keeps separate keys. New devices receive future messages automatically; transfer older history below. Revoke devices you no longer use.</Typography>{devices.map(d => <Box key={d.deviceId} sx={{ my: 2 }}><Typography variant="body2">{d.deviceId}</Typography><Button color="error" onClick={() => revoke(d.deviceId)}>Revoke device</Button></Box>)}<MessagingHistoryTransfer userId={userId} onRestored={() => { for (const [id, conversation] of knownConversations.current) void refresh(id, conversation.peerId).catch(() => {}); refreshInbox(); }} /></DialogContent></Dialog>{children}</Context.Provider>;
}
