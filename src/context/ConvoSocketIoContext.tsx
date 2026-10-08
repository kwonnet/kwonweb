'use client';
import { createContext, useContext, useEffect, useCallback, useRef, useState, type ReactNode } from 'react';
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuthSession } from '@/hooks';
import { useSocketIoContext } from './SocketIoContext';
import { hasMessagingVault, unlockMessaging, lockMessaging, resetMessagingDevice, currentMessagingRuntime, signMessaging } from '@/lib/signal/deviceManager';
import { resetLocalMessaging, enroll, decryptWire, localConversation, messagingAPI, flushMessagingOutbox, type SyncResult } from '@/lib/conversations/messaging';
import type { MessagingDevice, LocalMessage } from '@/lib/signal/contracts';
import type { EncryptedChatMessage } from '@/types/conversation';
import { mutate } from 'swr';
type State = {
    convoSocketIo?: ReturnType<typeof useSocketIoContext>['convoSocketIo'];
    messages: LocalMessage[];
    ready: boolean;
    revision: number;
    refresh: (conversationId: string, peerId: string) => Promise<SyncResult | undefined>;
    updateMesssages: (payload: EncryptedChatMessage[]) => Promise<void>;
};
const Context = createContext<State>({ messages: [], ready: false, revision: 0, refresh: async () => undefined, updateMesssages: async () => { } });
export const useConvoSocketIoContext = () => useContext(Context);
export default function ConvoSocketIoProvider({ children }: {
    children: ReactNode;
}) {
    const { user, token: authToken } = useAuthSession();
    const token = authToken ?? '';
    const userId = user?.id ?? '';
    const { convoSocketIo } = useSocketIoContext();
    const [ready, setReady] = useState(false), [existing, setExisting] = useState(false), [passphrase, setPassphrase] = useState(''), [confirmation, setConfirmation] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [devices, setDevices] = useState<MessagingDevice[]>([]), [showDevices, setShowDevices] = useState(false);
    const [messages, setMessages] = useState<LocalMessage[]>([]), [revision, setRevision] = useState(0);
    const inFlight = useRef(new Map<string, Promise<SyncResult | undefined>>());
    const generation = useRef(0);
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
        if (prior)
            return prior;
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
                try {
                    result = await messagingAPI<SyncResult>(userId, token, `/${conversationId}/messages?after=${cursor}&receiptAfter=${receiptCursor}`);
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
            } while (result.messages.length === 100 || result.receipts.length === 100);
            const local = await localConversation(userId, conversationId, peerId);
            if (epoch !== generation.current)
                return;
            setMessages(local);
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
                convoSocketIo.emit('device:bind', { deviceId: r.deviceId, signature });
            }
            catch {
                setError('Reconnect after unlocking messaging');
            }
        };
        // Request a new challenge too: connection may predate the vault unlock.
        convoSocketIo.on('device:challenge', bind);
        void enroll(userId, token).then(() => convoSocketIo.emit('device:challenge')).catch(() => setError('Device enrollment failed; unlock messaging again'));
        const available = () => { setRevision(n => n + 1); void mutate(key => Array.isArray(key) ? key[0] === `/v1/users/${userId}/stats` : !!key && typeof key === 'object' && 'type' in key && String(key.type).endsWith('_convo')); };
        convoSocketIo.on('message:available', available);
        return () => { convoSocketIo.off('device:challenge', bind); convoSocketIo.off('message:available', available); };
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
        return <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}><Paper sx={{ p: 3 }}><Stack spacing={2}><Typography variant="h5">{existing ? 'Unlock encrypted messages' : 'Set up encrypted messages'}</Typography><Typography>Your messaging passphrase protects keys on this browser. Use at least 12 characters. Keep it safe: resetting your account password cannot recover these messages.</Typography>{error && <Alert severity="error">{error}</Alert>}<TextField label="Messaging passphrase" type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)} autoComplete={existing ? 'current-password' : 'new-password'}/>{!existing && <TextField label="Confirm messaging passphrase" type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="new-password"/>}{existing && <Button color="warning" onClick={async () => {
                    if (!window.confirm('Remove this browser’s messaging keys and history? This cannot be undone. You will need a new device identity.'))
                        return;
                    try {
                        await resetLocalMessaging(userId,token);
                        setExisting(false);
                        setError('');
                    }
                    catch (e) {
                        setError(e instanceof Error ? e.message : 'Unable to reset local messaging');
                    }
                }}>Reset messaging on this browser</Button>}<Button loading={busy} variant="contained" disabled={passphrase.length < 12} onClick={unlock}>{existing ? 'Unlock' : 'Set up messaging'}</Button></Stack></Paper></Box>;
    return <Context.Provider value={{ convoSocketIo, messages, ready, revision, refresh, updateMesssages: async () => { } }}>{error && <Alert severity="error">{error}</Alert>}<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><Button size="small" onClick={listDevices}>Messaging devices</Button><Button size="small" onClick={() => { generation.current++; lockMessaging(); setReady(false); setMessages([]); }}>Lock messages</Button></Box><Dialog open={showDevices} onClose={() => setShowDevices(false)}><DialogTitle>Messaging devices</DialogTitle><DialogContent><Typography>Each browser keeps separate keys. New devices receive future messages. Revoke devices you no longer use.</Typography>{devices.map(d => <Box key={d.deviceId} sx={{ my: 2 }}><Typography variant="body2">{d.deviceId}</Typography><Button color="error" onClick={() => revoke(d.deviceId)}>Revoke device</Button></Box>)}</DialogContent></Dialog>{children}</Context.Provider>;
}
