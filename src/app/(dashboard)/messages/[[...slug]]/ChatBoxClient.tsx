'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Avatar, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import { ArrowBackIosNewOutlined, AttachFile, SendOutlined } from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks';
import { useConvoSocketIoContext } from '@/context/ConvoSocketIoContext';
import { createConversation } from '@/lib/conversations';
import { MessageQueuedError, messagingAPI, sendContent, sendMedia, sendReceiptBatch, forgetConversation, hideMessage } from '@/lib/conversations/messaging';
import { type Conversation, type EncryptedChatMessage } from '@/types/conversation';
import type { MessagingDevice, LocalMessage, Content } from '@/lib/signal/contracts';
import type { UserPublic } from '@/types/user';
import ChatBubble from './ChatBubble';
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
    const { messages, refresh, convoSocketIo: socket, revision, liveReady, processed } = useConvoSocketIoContext();
    const router = useRouter();
    const [convo, setConvo] = useState(params.convo), [text, setText] = useState(''), [files, setFiles] = useState<File[]>([]), [reply, setReply] = useState<LocalMessage>(), [error, setError] = useState(''), [busy, setBusy] = useState(false), [typingUntil, setTypingUntil] = useState(0), [now, setNow] = useState(Date.now());
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
    const chats = messages.filter(m => m.conversation === convo?.id);
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
        run(); }, delay + Math.random() * 1000); }; run(); const focus = () => { setNow(Date.now()); void sync(); }; window.addEventListener('focus', focus); window.addEventListener('online', focus); return () => { stopped = true; clearTimeout(timer); window.removeEventListener('focus', focus); window.removeEventListener('online', focus); }; }, [sync, liveReady]);
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
                    if (document.visibilityState === 'visible' && document.hasFocus())
                        viewed.current.add(id);
                }
                else
                    visible.current.delete(id);
            }
            setNow(Date.now());
        }, { root: pane.current, threshold: 0.5 });
        pane.current?.querySelectorAll('[data-message-id]').forEach(element => observer.observe(element));
        return () => observer.disconnect();
    }, [messages, convo?.id]);
    useEffect(() => {
        if (document.visibilityState === 'visible' && document.hasFocus())
            visible.current.forEach(id => viewed.current.add(id));
    }, [now]);
    useEffect(() => {
        if (!convo || pending)
            return;
        const received = (processed ?? chats.map(m => ({ id: m.id, fromUserId: m.fromUserId, action: false }))).filter(m => m.fromUserId !== user.id);
        const focused = document.visibilityState === 'visible' && document.hasFocus();
        for (const m of received) {
            const status = focused && (m.action || visible.current.has(m.id)) && !read.current.has(m.id) ? 'READ' : !delivered.current.has(m.id) ? 'DELIVERED' : undefined;
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
                return; applied=true;batch.forEach(([id, status]) => { if (receiptQueue.current.get(id) === status)
                receiptQueue.current.delete(id); delivered.current.add(id); if (status === 'READ')
                read.current.add(id); }); }).catch(e => setError(e instanceof Error ? e.message : 'Unable to save receipts')).finally(() => { receiptBusy.current = false; receiptTimer.current = undefined;if(applied&&epoch===receiptEpoch.current&&receiptQueue.current.size)receiptTimer.current=setTimeout(flush,250); });
        };
        if (!receiptTimer.current && !receiptBusy.current)
            receiptTimer.current = setTimeout(flush, 250);
    }, [messages, processed, convo?.id, pending, user.id, token, now]);
    useEffect(() => () => {receiptEpoch.current++;clearTimeout(receiptTimer.current);}, []);
    useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [chats.length]);
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
        if (busy || incoming)
            return;
        setBusy(true);
        setError('');
        try {
            const c = await ensureConversation();
            const quoted = reply ? { targetId: reply.event.eventId, targetHash: reply.hash } : undefined;
            if (content)
                await sendContent(user.id, token, peer.id, c.id, content);
            else if (files.length)
                await sendMedia(user.id, token, peer.id, c.id, files, text, quoted);
            else if (text.trim())
                await sendContent(user.id, token, peer.id, c.id, { kind: 'text', text: text.trim(), reply: quoted });
            setText('');
            setFiles([]);
            setReply(undefined);
            socket?.emit('typing:stop', { conversationId: c.id });
            await refresh(c.id, peer.id);
        }
        catch (e) {
            if (e instanceof MessageQueuedError) {
                setText('');
                setFiles([]);
                setReply(undefined);
                if (convo)
                    await refresh(convo.id, peer.id).catch(() => { });
            }
            setError(e instanceof Error ? e.message : 'Unable to send message');
        }
        finally {
            setBusy(false);
        }
    };
    const resolve = async (action: 'accept' | 'reject' | 'block') => {
        if (!convo)
            return;
        setBusy(true);
        setError('');
        try {
            const received = chats.filter(m => m.fromUserId !== user.id && !m.integrityFailed && !m.queued).slice(-100).map(m => m.id);
            await messagingAPI(user.id, token, `/${convo.id}/request`, 'POST', { action, deliveredIds: action === 'accept' ? received : [], readIds: action === 'accept' && document.visibilityState === 'visible' && document.hasFocus() ? received.filter(id => viewed.current.has(id)) : [] });
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
            return;
        }
        const target = { targetId: m.event.eventId, targetHash: m.hash };
        if (kind === 'reaction')
            return send({ ...target, kind: 'reaction', emoji: value as '👍', remove: m.reactions.some(r => r.userId === user.id && r.reaction === value) });
        if (kind === 'edit') {
            const next = window.prompt('Edit message', m.content);
            if (next?.trim())
                await send({ ...target, kind: 'edit', text: next.trim(), revision: m.revision + 1 });
        }
        if (kind === 'delete')
            await send({ ...target, kind: 'delete', signature: '' });
    };
    return <Stack sx={{ height: 'calc(100vh - 100px)', minHeight: 400 }}>
  <Paper sx={{ p: 1 }} elevation={0}><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><IconButton component={Link} href="/messages"><ArrowBackIosNewOutlined /></IconButton><Avatar src={peer.avatar ?? undefined}/><Box><Typography sx={{ fontWeight: 700 }}>{peer.name}</Typography><Typography variant="caption">@{peer.username} · End-to-end encrypted</Typography></Box><Button size="small" onClick={verifyKeys}>Verify keys</Button></Stack></Paper>
  <Dialog open={showKeys} onClose={() => setShowKeys(false)}><DialogTitle>Verify device identities</DialogTitle><DialogContent><Typography>Compare these fingerprints with your contact through a trusted channel. First-use trust alone does not prove who owns a key.</Typography>{fingerprints.map(f => <Box key={f.id} sx={{ my: 2, overflowWrap: 'anywhere' }}><Typography variant="caption">{f.id}</Typography><Typography sx={{ fontFamily: 'monospace' }}>{f.hash}</Typography></Box>)}</DialogContent></Dialog>
  {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
  <Box ref={pane} sx={{ flex: 1, overflowY: 'auto', p: 1 }}>{chats.map(m => <Box key={m.id} data-message-id={m.id}><ChatBubble message={m} isSender={m.fromUserId === user.id} onAction={(kind, value) => action(m, kind, value)} disabled={busy || !!pending || !!m.queued || !!m.integrityFailed} userId={user.id} token={token}/></Box>)}<div ref={end}/></Box>
  {incoming ? <Paper sx={{ p: 2 }}><Typography>Preview privately. No delivered or read receipts are sent until you accept.</Typography><Stack direction="row" spacing={1}><Button disabled={busy} onClick={() => resolve('accept')}>Accept</Button><Button disabled={busy} onClick={() => resolve('reject')}>Reject</Button><Button disabled={busy} color="error" onClick={() => resolve('block')}>Block</Button></Stack></Paper> : <Box sx={{ p: 1 }}>
   {pending && <Typography variant="caption">Message request sent. Receipts appear after acceptance.</Typography>}
   {!pending && typingUntil > now && <Typography variant="caption">{peer.name} is typing…</Typography>}
   {reply && <Alert onClose={() => setReply(undefined)}>Replying to: {reply.content.slice(0, 100)}</Alert>}
   {files.length > 0 && <Alert onClose={() => setFiles([])}>{files.map(f => f.name).join(', ')}</Alert>}
   <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><input hidden ref={fileInput} type="file" multiple accept="image/png,image/jpeg,image/webp,video/mp4,audio/mpeg,application/pdf" onChange={e => {
                const selected = Array.from(e.target.files ?? []);
                if (selected.length > 10 || selected.some(f => f.size > 8388608))
                    setError('Select up to 10 files, each under 8 MB');
                else
                    setFiles(selected);
                e.target.value = '';
            }}/><IconButton disabled={busy} onClick={() => fileInput.current?.click()} aria-label="Attach encrypted file"><AttachFile /></IconButton><TextField fullWidth size="small" multiline maxRows={3} value={text} placeholder="Message" disabled={busy} onChange={e => {
                setText(e.target.value);
                if (convo && !pending)
                    socket?.emit('typing:start', { conversationId: convo.id });
            }} onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (text.trim() || files.length)
                        void send();
                }
            }}/><IconButton aria-label="Send message" disabled={busy || (!text.trim() && !files.length)} onClick={() => send()}><SendOutlined /></IconButton></Stack>
  </Box>}
 </Stack>;
}
