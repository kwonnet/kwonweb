'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Avatar, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Paper, Stack, TextField, Typography, CircularProgress } from '@mui/material';
import { ArrowBackIosNewOutlined, AttachFile, SendOutlined, LockOutlined } from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks';
import { useConvoSocketIoContext, MessagingOptionsButton } from '@/context/ConvoSocketIoContext';
import { createConversation } from '@/lib/conversations';
import { MessageQueuedError, messagingAPI, sendContent, sendMedia, sendReceiptBatch, forgetConversation, hideMessage } from '@/lib/conversations/messaging';
import { type Conversation, type EncryptedChatMessage } from '@/types/conversation';
import type { MessagingDevice, LocalMessage, Content } from '@/lib/signal/contracts';
import type { UserPublic } from '@/types/user';
import ChatBubble from './ChatBubble';
import { IMAGE_TYPES, validateImageUploads } from '@/lib/signal/attachments';
export default function ChatBoxClient({ params }: {
    params: {
        recipient: UserPublic;
        convo?: Conversation;
        recipientDevices: unknown[];
        messages: EncryptedChatMessage[];
    };
}) {
    const { user, token: authToken } = useAuthSession();
    const token = authToken ?? '';
    const { messages, refresh, refreshInbox, convoSocketIo: socket, revision, liveReady, processed, loadingConversations } = useConvoSocketIoContext();
    const router = useRouter();
    const [convo, setConvo] = useState(params.convo), [text, setText] = useState(''), [files, setFiles] = useState<File[]>([]), [reply, setReply] = useState<LocalMessage>(), [error, setError] = useState(''), [busy, setBusy] = useState(false), [typingUntil, setTypingUntil] = useState(0), [now, setNow] = useState(Date.now());
    const [outgoing, setOutgoing] = useState<LocalMessage[]>([]);
    const sending = useRef(false);
    const pane = useRef<HTMLDivElement>(null), visible = useRef(new Set<string>()), viewed = useRef(new Set<string>());
    const receiptEpoch=useRef(0);
    const receiptQueue = useRef(new Map<string, 'READ' | 'DELIVERED'>()), receiptTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), receiptBusy = useRef(false);
    const delivered = useRef(new Set<string>()), read = useRef(new Set<string>()), end = useRef<HTMLDivElement>(null), fileInput = useRef<HTMLInputElement>(null);
    const peer = params.recipient;
    const [fingerprints, setFingerprints] = useState<{
        id: string;
        hash: string;
    }[]>([]), [showKeys, setShowKeys] = useState(false);
    const pending = convo?.state === 'PENDING_REQUEST';
    const incoming = pending && convo?.responder.id === user.id;
    const confirmed = messages.filter(m => m.conversation === convo?.id);
    const chats = confirmed.concat(outgoing.filter(m => !confirmed.some(saved => saved.eventId === m.eventId)));
    useEffect(() => {
        setOutgoing(previous => previous.filter(m => !messages.some(saved => saved.eventId === m.eventId)));
    }, [messages]);
    const sync = useCallback(async () => {
        if (!convo)
            return;
        try {
            const result = await refresh(convo.id, peer.id);
            if (result)
                setConvo(previous => previous ? { ...previous, ...result.conversation } : previous);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to load messages');
        }
    }, [convo?.id, refresh, peer.id]);
    useEffect(() => { void sync(); let stopped = false; let delay = liveReady ? 60000 : 5000; let timer: ReturnType<typeof setTimeout>; const run = () => { timer = setTimeout(async () => { if (document.visibilityState === 'visible')
        await sync(); delay = Math.min(60000, delay * 2); if (!stopped)
        run(); }, delay + Math.random() * 1000); }; run(); const focus = () => { setNow(Date.now()); if (document.visibilityState === 'visible') void sync(); }; window.addEventListener('focus', focus); window.addEventListener('online', focus); document.addEventListener('visibilitychange', focus); return () => { stopped = true; clearTimeout(timer); window.removeEventListener('focus', focus); window.removeEventListener('online', focus); document.removeEventListener('visibilitychange', focus); }; }, [sync, liveReady]);
    useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 3000); return () => clearInterval(timer); }, []);
    useEffect(() => {
        if (revision)
            void sync();
    }, [revision, sync]);
    useEffect(() => { receiptEpoch.current++;clearTimeout(receiptTimer.current); receiptTimer.current = undefined; receiptQueue.current.clear(); delivered.current.clear(); read.current.clear(); visible.current.clear(); viewed.current.clear(); setReply(undefined); }, [convo?.id]);
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                const id = (entry.target as HTMLElement).dataset.messageId!;
                if (entry.isIntersecting) {
                    visible.current.add(id);
                    if (document.visibilityState === 'visible')
                        viewed.current.add(id);
                }
                else
                    visible.current.delete(id);
            }
            setNow(Date.now());
        }, { root: pane.current, threshold: 0 });
        pane.current?.querySelectorAll('[data-message-id]').forEach(element => observer.observe(element));
        return () => observer.disconnect();
    }, [messages, convo?.id]);
    useEffect(() => {
        if (document.visibilityState === 'visible')
            visible.current.forEach(id => viewed.current.add(id));
    }, [now]);
    useEffect(() => {
        if (!convo || pending)
            return;
        const received = [...new Map([...(processed?.filter(m => m.conversationId === convo.id) ?? []), ...chats.filter(m => !m.queued && !m.sendingState && !m.integrityFailed && new Date(m.createdAt).getTime() > Date.now() - 90 * 86400000).map(m => ({ id: m.id, fromUserId: m.fromUserId, action: false }))].map(message => [message.id, message])).values()].filter(m => m.fromUserId !== user.id);
        const focused = document.visibilityState === 'visible';
        for (const m of received) {
            // Opening an accepted conversation reads its authenticated history through the latest message.
            const status = focused && !read.current.has(m.id) ? 'READ' : !delivered.current.has(m.id) ? 'DELIVERED' : undefined;
            if (status && (status === 'READ' || receiptQueue.current.get(m.id) !== 'READ'))
                receiptQueue.current.set(m.id, status);
        }
        const epoch=receiptEpoch.current;
        const flush = () => {
            if(epoch!==receiptEpoch.current)return;
            if (receiptBusy.current || !receiptQueue.current.size)
                return;
            receiptBusy.current = true;
            const batch = [...receiptQueue.current.entries()].slice(0, 100);
            const reads = batch.filter(([, s]) => s === 'READ').map(([id]) => id), deliveries = batch.filter(([, s]) => s === 'DELIVERED').map(([id]) => id);
            let applied=false;
            void sendReceiptBatch(user.id, token, convo.id, deliveries, reads).then(result => { if (result.suppressed)
                return; refreshInbox?.(convo.id, result); if(epoch!==receiptEpoch.current)return; applied=true;batch.forEach(([id, status]) => { if (receiptQueue.current.get(id) === status)
                receiptQueue.current.delete(id); delivered.current.add(id); if (status === 'READ')
                read.current.add(id); }); }).catch(e => setError(e instanceof Error ? e.message : 'Unable to save receipts')).finally(() => { receiptBusy.current = false; receiptTimer.current = undefined;if(applied&&epoch===receiptEpoch.current&&receiptQueue.current.size)receiptTimer.current=setTimeout(flush,250); });
        };
        if (!receiptTimer.current && !receiptBusy.current)
            receiptTimer.current = setTimeout(flush, 250);
    }, [messages, processed, convo?.id, pending, user.id, token, now, refreshInbox]);
    useEffect(() => () => {receiptEpoch.current++;clearTimeout(receiptTimer.current);}, []);
    useEffect(() => { end.current?.scrollIntoView({ behavior: 'auto' }); }, [chats.length]);
    useEffect(() => {
        const start = (event: {
            conversationId: string;
            userId: string;
            expiresAt: number;
        }) => {
            if (event.conversationId === convo?.id && event.userId === peer.id && !pending)
                setTypingUntil(event.expiresAt);
        };
        const stop = () => setTypingUntil(0);
        socket?.on('typing:start', start);
        socket?.on('typing:stop', stop);
        return () => { socket?.off('typing:start', start); socket?.off('typing:stop', stop); };
    }, [socket, convo?.id, peer.id, pending]);
    const verifyKeys = async () => {
        try {
            const devices = (await Promise.all([messagingAPI<MessagingDevice[]>(user.id, token, `/users/${user.id}/devices`), messagingAPI<MessagingDevice[]>(user.id, token, `/users/${peer.id}/devices`)])).flat();
            const hashes = await Promise.all(devices.map(async (d) => ({ id: `${d.userId}: ${d.deviceId}`, hash: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(['kwonnet-device-fingerprint', 2, d.userId, d.deviceId, d.identityPublic, d.actionSigningPublic]))))).map(v => v.toString(16).padStart(2, '0')).join(' ').replaceAll(' ', '') })));
            setFingerprints(hashes);
            setShowKeys(true);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to load identities');
        }
    };
    const ensureConversation = async () => {
        if (convo)
            return convo;
        const created = await createConversation({ recipientId: peer.id }, token);
        setConvo(created);
        return created;
    };
    const send = async (content?: Content) => {
        if (sending.current || incoming || (!content && !text.trim() && !files.length)) return;
        const submittedText = text.trim(), submittedFiles = files.slice();
        const quoted = reply ? { targetId: reply.event.eventId, targetHash: reply.hash } : undefined;
        try { if (!content) validateImageUploads(submittedFiles); }
        catch (e) { setError((e as Error).message); return; }
        sending.current = true;
        setBusy(true);
        setError('');
        const eventId = crypto.randomUUID(), createdAt = new Date().toISOString();
        // A local projection appears before enrollment, encryption, uploads or network I/O.
        // The same event ID is used by the durable encrypted outbox and server deduplication.
        if (!content) {
            const event: LocalMessage['event'] = { v: 2, eventId, conversationId: convo?.id ?? '', senderId: user.id, senderDeviceId: '', createdAt, content: { kind: 'text', text: submittedText, reply: quoted } };
            setOutgoing(previous => previous.filter(m => m.sendingState !== 'failed').concat({ id: eventId, eventId, conversation: convo?.id ?? '', fromUserId: user.id, fromDeviceId: '', senderSignalDeviceId: 0, senderActionSigningPublic: '', senderIdentityPublic: '', toUserId: peer.id, toDeviceId: '', serverSequence: '0', createdAt, wireType: 1, ciphertextB64: '', seen: [], read: [], event, hash: '', content: submittedText, reply: quoted, reactions: [], deleted: false, revision: 0, sendingState: 'sending', pendingFilenames: submittedFiles.map(file => file.name) }));
            setText(''); setFiles([]); setReply(undefined);
        }
        let active = convo;
        try {
            active = await ensureConversation();
            if (content) await sendContent(user.id, token, peer.id, active.id, content, eventId);
            else if (submittedFiles.length) await sendMedia(user.id, token, peer.id, active.id, submittedFiles, submittedText, quoted, eventId);
            else await sendContent(user.id, token, peer.id, active.id, { kind: 'text', text: submittedText, reply: quoted }, eventId);
            setOutgoing(previous => previous.map(m => m.eventId === eventId ? { ...m, conversation: active!.id, sendingState: 'sent' } : m));
            socket?.emit('typing:stop', { conversationId: active.id });
            refreshInbox?.();
        }
        catch (e) {
            const queued = e instanceof MessageQueuedError;
            setOutgoing(previous => previous.map(m => m.eventId === eventId ? { ...m, conversation: active?.id ?? m.conversation, queued, sendingState: queued ? undefined : 'failed' } : m));
            if (!queued && !content) {
                setText(current => current || submittedText);
                setFiles(current => current.length ? current : submittedFiles);
                setReply(current => current ?? reply);
            }
            setError(e instanceof Error ? e.message : 'Unable to send message');
        }
        finally {
            sending.current = false;
            setBusy(false);
            // Sync failure must not mislabel an already accepted message as a failed send.
            if (active) void refresh(active.id, peer.id).catch(() => {});
        }
    };
    const resolve = async (action: 'accept' | 'reject' | 'block') => {
        if (!convo)
            return;
        setBusy(true);
        setError('');
        try {
            const received = chats.filter(m => m.fromUserId !== user.id && !m.integrityFailed && !m.queued && new Date(m.createdAt).getTime() > Date.now() - 90 * 86400000).slice(-100).map(m => m.id);
            await messagingAPI(user.id, token, `/${convo.id}/request`, 'POST', { action, deliveredIds: action === 'accept' ? received : [], readIds: action === 'accept' && document.visibilityState === 'visible' ? received.filter(id => viewed.current.has(id)) : [] });
            refreshInbox?.();
            if (action === 'accept') {
                setConvo({ ...convo, state: 'ACCEPTED', responder: { ...convo.responder, acceptedAt: new Date().toISOString() } });
                await sync();
                router.replace(`/messages/${peer.id}/chat`);
            }
            else {
                await forgetConversation(user.id, convo.id);
                router.replace(`/messages/${user.id}/requests/list`);
            }
            router.refresh();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to resolve request');
        }
        finally {
            setBusy(false);
        }
    };
    const action = async (m: LocalMessage, kind: 'reply' | 'edit' | 'delete' | 'hide' | 'reaction', value?: string) => {
        if (kind === 'reply') {
            setReply(m);
            return;
        }
        if (kind === 'hide') {
            try {
                await hideMessage(user.id, token, m.conversation, m.id);
                await sync();
            }
            catch (e) {
                setError(e instanceof Error ? e.message : 'Unable to hide message');
            }
            refreshInbox?.();
            return;
        }
        const target = { targetId: m.event.eventId, targetHash: m.hash };
        if (kind === 'reaction')
            return send({ ...target, kind: 'reaction', emoji: value!, remove: m.reactions.some(r => r.userId === user.id && r.reaction === value) });
        if (kind === 'edit') {
            const next = window.prompt('Edit message', m.content);
            if (next?.trim())
                await send({ ...target, kind: 'edit', text: next.trim(), revision: m.revision + 1 });
        }
        if (kind === 'delete')
            await send({ ...target, kind: 'delete', signature: '' });
    };
    return <Stack sx={{ height: '100%', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
  <Paper sx={{ p: 1, flexShrink: 0 }} elevation={0}><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><IconButton component={Link} href="/messages"><ArrowBackIosNewOutlined /></IconButton><Avatar src={peer.avatar ?? undefined}/><Box sx={{ flex: 1, minWidth: 0 }}><Typography noWrap sx={{ fontWeight: 700 }}>{peer.name}</Typography><Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}>@{peer.username} </Typography></Box><IconButton aria-label="Verify E2E encryption" title="End-to-end encrypted · verify keys" onClick={verifyKeys}><LockOutlined fontSize="small" /></IconButton><MessagingOptionsButton /></Stack></Paper>
  <Dialog open={showKeys} onClose={() => setShowKeys(false)}><DialogTitle>Verify device identities</DialogTitle><DialogContent><Typography>Compare these fingerprints with your contact through a trusted channel. First-use trust alone does not prove who owns a key.</Typography>{fingerprints.map(f => <Box key={f.id} sx={{ my: 2, overflowWrap: 'anywhere' }}><Typography variant="caption">{f.id}</Typography><Typography sx={{ fontFamily: 'monospace' }}>{f.hash}</Typography></Box>)}</DialogContent></Dialog>
  {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
  <Box ref={pane} aria-busy={!!loadingConversations?.[convo?.id ?? '']} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', p: 1 }}>{loadingConversations?.[convo?.id ?? ''] && <Stack role="status" direction="row" spacing={1} sx={{ p: 1, alignItems: 'center' }}><CircularProgress size={16} /><Typography variant="caption">{chats.length ? 'Syncing messages…' : 'Loading and decrypting messages…'}</Typography></Stack>}{chats.map(m => <Box key={m.id} data-event-id={m.eventId} data-message-id={m.sendingState || m.queued ? undefined : m.id}><ChatBubble message={m} isSender={m.fromUserId === user.id} onAction={(kind, value) => action(m, kind, value)} disabled={busy || !!pending || !!m.queued || !!m.sendingState || !!m.integrityFailed} userId={user.id} token={token} replyMessage={chats.find(original => original.eventId === m.reply?.targetId && original.hash === m.reply?.targetHash)} onReplyClick={targetId => {
        const target = Array.from(pane.current?.querySelectorAll<HTMLElement>('[data-event-id]') ?? []).find(element => element.dataset.eventId === targetId);
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target?.animate?.([{ backgroundColor: 'rgba(100,181,246,.3)' }, { backgroundColor: 'transparent' }], { duration: 1200 });
    }}/></Box>)}<div ref={end}/></Box>
  {incoming ? <Paper sx={{ p: 2 }}><Typography>Preview privately. No delivered or read receipts are sent until you accept.</Typography><Stack direction="row" spacing={1}><Button disabled={busy} onClick={() => resolve('accept')}>Accept</Button><Button disabled={busy} onClick={() => resolve('reject')}>Reject</Button><Button disabled={busy} color="error" onClick={() => resolve('block')}>Block</Button></Stack></Paper> : <Box sx={{ p: 1, flexShrink: 0, pb: 'max(8px, env(safe-area-inset-bottom))' }}>
   {pending && <Typography variant="caption">Message request sent. Receipts appear after acceptance.</Typography>}
   {!pending && typingUntil > now && <Typography variant="caption">{peer.name} is typing…</Typography>}
   {reply && <Alert onClose={() => setReply(undefined)}>Replying to: {reply.content.slice(0, 100)}</Alert>}
   {files.length > 0 && <Alert onClose={() => setFiles([])}>{files.map(f => f.name).join(', ')}</Alert>}
   <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><input hidden ref={fileInput} type="file" multiple accept={IMAGE_TYPES.join(',')} onChange={e => {
                const selected = Array.from(e.target.files ?? []);
                try { validateImageUploads(selected); setFiles(selected); setError(''); }
                catch (error) { setError((error as Error).message); }
                e.target.value = '';
            }}/><IconButton disabled={busy} onClick={() => fileInput.current?.click()} aria-label="Attach images up to 500 KB"><AttachFile /></IconButton><TextField fullWidth size="small" multiline maxRows={3} value={text} placeholder="Message" slotProps={{ htmlInput: { maxLength: 10000 }, input: { sx: { fontSize: 16, borderRadius: 6 } } }} onChange={e => {
                setText(e.target.value);
                if (convo && !pending)
                    socket?.emit('typing:start', { conversationId: convo.id });
            }} onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    if (text.trim() || files.length)
                        void send();
                }
            }}/><IconButton aria-label="Send message" disabled={busy || (!text.trim() && !files.length)} onClick={() => send()}><SendOutlined /></IconButton></Stack>
  </Box>}
 </Stack>;
}
