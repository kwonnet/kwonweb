'use client';
import PasswordTextField from '@/components/common/PasswordTextField';
import { createContext, useContext, useEffect, useCallback, useRef, useState, type ReactNode } from 'react';
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, Paper, Stack, Typography } from '@mui/material';
import { useAuthSession } from '@/hooks';
import { useSocketIoContext } from './SocketIoContext';
import { hasMessagingVault, unlockMessaging, lockMessaging, resetMessagingDevice, currentMessagingRuntime, signMessaging } from '@/lib/signal/deviceManager';
import { setMessagingSocket, syncMessages, resetLocalMessaging, enroll, decryptWire, localConversation, messagingAPI, flushMessagingOutbox, type SyncResult } from '@/lib/conversations/messaging';
import type { MessagingDevice, LocalMessage } from '@/lib/signal/contracts';
import { mutate } from 'swr';
type State = {
    convoSocketIo?: ReturnType<typeof useSocketIoContext>['convoSocketIo'];
    messages: LocalMessage[];
    ready: boolean;
    revision: number;
    liveReady: boolean;
    processed: {
        id: string;
        fromUserId: string;
        action: boolean;
    }[];
    refresh: (conversationId: string, peerId: string) => Promise<SyncResult | undefined>;
};
const Context = createContext<State>({ messages: [], ready: false, revision: 0, liveReady: false, processed: [], refresh: async () => undefined });
export const useConvoSocketIoContext = () => useContext(Context);
export default function ConvoSocketIoProvider({ children }: {
    children: ReactNode;
}) {
    const { user, token: authToken } = useAuthSession();
    const token = authToken ?? '';
    const userId = user?.id ?? '';
    const { convoSocketIo } = useSocketIoContext();
    const [ready, setReady] = useState(false), [existing, setExisting] = useState(false), [passphrase, setPassphrase] = useState(''), [confirmation, setConfirmation] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [processed, setProcessed] = useState<{
        id: string;
        fromUserId: string;
        action: boolean;
    }[]>([]);
    const [liveReady, setLiveReady] = useState(false);
    const [devices, setDevices] = useState<MessagingDevice[]>([]), [showDevices, setShowDevices] = useState(false);
    const [messages, setMessages] = useState<LocalMessage[]>([]), [revision, setRevision] = useState(0);
    const inFlight = useRef(new Map<string, Promise<SyncResult | undefined>>());
    const generation = useRef(0);
    const dirty = useRef(new Set<string>());
    useEffect(() => {
        generation.current++;
        lockMessaging();
        setReady(false);
        setMessages([]);
        setPassphrase('');
        setConfirmation('');
        if (userId)
            void hasMessagingVault(userId).then(setExisting);
        return () => { generation.current++; lockMessaging(); };
    }, [userId]);
    const unlock = async () => {
        setBusy(true);
        setError('');
        const epoch = generation.current;
        try {
            if (!existing && passphrase !== confirmation)
                throw new Error('Passphrases do not match');
            await unlockMessaging(userId, passphrase);
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
    const refresh = useCallback((conversationId: string, peerId: string) => {
        const prior = inFlight.current.get(conversationId);
        if (prior) {
            dirty.current.add(conversationId);
            return prior;
        }
        const epoch = generation.current;
        const work = (async () => {
            if (!ready)
                return;
            const r = currentMessagingRuntime(userId);
            try {
                await flushMessagingOutbox(userId, token);
            }
            catch {
                console.warn("Messaging outbox will retry; no message data logged.");
            }
            let cursor = await r.vault.atomic(async (draft) => draft.records[`cursor:${conversationId}`] ?? '0');
            let receiptCursor = await r.vault.atomic(async (draft) => draft.records[`receipt-cursor:${conversationId}`] ?? '0');
            let result: SyncResult | undefined;
            do {
                dirty.current.delete(conversationId);
                try {
                    result = await syncMessages(userId, token, conversationId, cursor, receiptCursor);
                }
                catch (error) {
                    if (epoch === generation.current)
                        setMessages(await localConversation(userId, conversationId, peerId));
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
            } while (result.messages.length === 100 || result.receipts.length === 100 || dirty.current.has(conversationId));
            const local = await localConversation(userId, conversationId, peerId);
            if (epoch !== generation.current)
                return;
            setMessages(local);
            setProcessed(await r.vault.atomic(async (draft) => Object.entries(draft.records).filter(([key]) => key.startsWith('wire:')).map(([, value]) => JSON.parse(value)).filter(wire => wire.conversation === conversationId && !draft.records[`failed:${wire.id}`] && new Date(wire.createdAt).getTime()>Date.now()-90*86400000 && !(JSON.parse(draft.records[`hidden:${conversationId}`]??'[]') as string[]).includes(wire.id)).map(wire => { const event = JSON.parse(draft.records[`event:${wire.eventId}`]); return { id: wire.id, fromUserId: wire.fromUserId, action: event.content.kind !== 'text' && event.content.kind !== 'media' }; })));
            return result;
        })();
        inFlight.current.set(conversationId, work);
        void work.finally(() => inFlight.current.delete(conversationId)).catch(() => { });
        return work;
    }, [ready, userId, token]);
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
        const available = () => { if (hintTimer)
            return; hintTimer = setTimeout(() => { hintTimer = undefined; setRevision(n => n + 1); void mutate(key => Array.isArray(key) ? key[0] === `/v1/users/${userId}/stats` : !!key && typeof key === 'object' && 'type' in key && String(key.type).endsWith('_convo')); }, 100); };
        const disconnected = () => { setMessagingSocket(userId); setLiveReady(false); };
        const connected = () => convoSocketIo.emit('device:challenge');
        convoSocketIo.on('connect', connected);
        convoSocketIo.on('disconnect', disconnected);
        convoSocketIo.on('message:available', available);
        return () => { clearTimeout(hintTimer); disconnected(); convoSocketIo.off('connect', connected); convoSocketIo.off('disconnect', disconnected); convoSocketIo.off('device:challenge', bind); convoSocketIo.off('message:available', available); };
    }, [ready, userId, token, convoSocketIo]);
    useEffect(() => {
        if (!ready)
            return;
        let timer: ReturnType<typeof setTimeout>;
        const activity = () => { clearTimeout(timer); timer = setTimeout(() => { generation.current++; lockMessaging(); setReady(false); setMessages([]); }, 15 * 60000); };
        activity();
        window.addEventListener('pointerdown', activity);
        window.addEventListener('keydown', activity);
        return () => { clearTimeout(timer); window.removeEventListener('pointerdown', activity); window.removeEventListener('keydown', activity); };
    }, [ready]);
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
    if (!userId)
        return <Alert severity="info">Sign in to use encrypted messaging.</Alert>;
    if (!ready)
        return <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}><Paper sx={{ p: 3 }}><Stack spacing={2}><Typography variant="h5">{existing ? 'Unlock encrypted messages' : 'Set up encrypted messages'}</Typography><Typography>Your messaging passphrase protects keys on this browser. Use at least 12 characters. Keep it safe: resetting your account password cannot recover these messages.</Typography>{error && <Alert severity="error">{error}</Alert>}<PasswordTextField label="Messaging passphrase" value={passphrase} onChange={e => setPassphrase(e.target.value)} autoComplete={existing ? 'current-password' : 'new-password'}/>{!existing && <PasswordTextField label="Confirm messaging passphrase" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="new-password"/>}{existing && <Button color="warning" onClick={async () => {
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
                }}>Reset messaging on this browser</Button>}<Button loading={busy} variant="contained" disabled={passphrase.length < 12} onClick={unlock}>{existing ? 'Unlock' : 'Set up messaging'}</Button></Stack></Paper></Box>;
    return <Context.Provider value={{ convoSocketIo, messages, ready, revision, liveReady, processed, refresh }}>{error && <Alert severity="error">{error}</Alert>}<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><Button size="small" onClick={listDevices}>Messaging devices</Button><Button size="small" onClick={() => { generation.current++; lockMessaging(); setReady(false); setMessages([]); }}>Lock messages</Button></Box><Dialog open={showDevices} onClose={() => setShowDevices(false)}><DialogTitle>Messaging devices</DialogTitle><DialogContent><Typography>Each browser keeps separate keys. New devices receive future messages. Revoke devices you no longer use.</Typography>{devices.map(d => <Box key={d.deviceId} sx={{ my: 2 }}><Typography variant="body2">{d.deviceId}</Typography><Button color="error" onClick={() => revoke(d.deviceId)}>Revoke device</Button></Box>)}</DialogContent></Dialog>{children}</Context.Provider>;
}
