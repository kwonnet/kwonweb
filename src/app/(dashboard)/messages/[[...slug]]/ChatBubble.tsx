'use client';
import { useEffect, useRef, useState } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography, IconButton, Menu, MenuItem, Popover } from '@mui/material';
import { DoneAllOutlined, CheckOutlined, AddReactionOutlined } from '@mui/icons-material';
import type { LocalMessage } from '@/lib/signal/contracts';
import type { DecryptedChatMessage } from '@/types/conversation';
import dynamic from 'next/dynamic';
import { EmojiStyle, Theme, type EmojiClickData } from 'emoji-picker-react';
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
import { loadMedia } from '@/lib/conversations/messaging';
function Media({ secret, message, userId, token }: {
    secret: NonNullable<LocalMessage['attachments']>[number];
    message: LocalMessage;
    userId: string;
    token: string;
}) {
    const [url, setUrl] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    useEffect(() => () => { if (url)
        URL.revokeObjectURL(url); }, [url]);
    const load = async () => { setBusy(true); try {
        const blob = await loadMedia(userId, token, message.conversation, secret);
        setUrl(URL.createObjectURL(blob));
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Attachment unavailable');
    }
    finally {
        setBusy(false);
    } };
    // Explicit download also avoids a media fetch revealing a pending preview to a sender.
    if (!url)
        return <Box><Button onClick={load} loading={busy}>Open {secret.filename}</Button>{error && <Typography color="error">{error}</Typography>}</Box>;
    if (secret.mime.startsWith('image/'))
        return <Box component="img" src={url} alt={secret.filename} sx={{ maxWidth: '100%', maxHeight: 300 }}/>;
    if (secret.mime.startsWith('video/'))
        return <Box component="video" src={url} controls sx={{ maxWidth: '100%' }}/>;
    if (secret.mime.startsWith('audio/'))
        return <audio src={url} controls/>;
    return <a href={url} download={secret.filename}>Download {secret.filename}</a>;
}
type Action = 'reply' | 'edit' | 'delete' | 'hide' | 'reaction';
export default function ChatBubble({ message, isSender, onAction, disabled, userId, token, replyMessage, onReplyClick }: {
    message: LocalMessage | DecryptedChatMessage;
    isSender: boolean;
    onAction?: (kind: Action, value?: string) => void;
    disabled?: boolean;
    userId?: string;
    token?: string;
    replyMessage?: LocalMessage;
    onReplyClick?: (targetId: string) => void;
}) {
    const m = 'event' in message ? message : undefined;
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null), [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
    const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), start = useRef({ x: 0, y: 0 }), lastTap = useRef(0), held = useRef(false);
    const cancelHold = () => { clearTimeout(hold.current); hold.current = undefined; };
    useEffect(() => () => clearTimeout(hold.current), []);
    const actionable = !!onAction && !disabled && !m?.integrityFailed;
    const interactive = (target: EventTarget) => (target as HTMLElement).closest?.('button,a,input,video,audio,[role="button"]');
    const seen = message.seen.some(r => r.userId === message.toUserId), read = message.read.some(r => r.userId === message.toUserId);
    const reactions = new Map<string, Set<string>>();
    for (const reaction of m?.reactions ?? []) {
        const users = reactions.get(reaction.reaction) ?? new Set<string>();
        users.add(reaction.userId); reactions.set(reaction.reaction, users);
    }
    const select = (kind: Action) => { setMenuAnchor(null); onAction?.(kind); };
    return <Stack sx={{ mb: 1, alignItems: isSender ? 'flex-end' : 'flex-start' }}>
      <Paper tabIndex={0} aria-label="Message. Double tap to reply; hold for options." onPointerDown={event => {
        if (!actionable || interactive(event.target)) return;
        held.current = false; start.current = { x: event.clientX, y: event.clientY };
        const element = event.currentTarget;
        hold.current = setTimeout(() => { held.current = true; lastTap.current = 0; setMenuAnchor(element); }, 500);
      }} onPointerMove={event => { if (Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > 10) { cancelHold(); lastTap.current = 0; held.current = true; } }} onPointerCancel={() => { cancelHold(); lastTap.current = 0; }} onPointerUp={event => {
        cancelHold();
        if (!actionable || held.current || interactive(event.target) || event.pointerType === 'mouse' || m?.deleted) return;
        const now = Date.now();
        if (lastTap.current && now - lastTap.current < 300) { lastTap.current = 0; onAction?.('reply'); }
        else lastTap.current = now;
      }} onDoubleClick={event => { if (actionable && !m?.deleted && !interactive(event.target)) onAction?.('reply'); }} onContextMenu={event => { event.preventDefault(); cancelHold(); if (actionable) { held.current = true; setMenuAnchor(event.currentTarget); } }} onKeyDown={event => {
        if (!actionable || interactive(event.target)) return;
        if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) { event.preventDefault(); setMenuAnchor(event.currentTarget); }
        if (event.key === 'Enter' && !m?.deleted) { event.preventDefault(); onAction?.('reply'); }
      }} sx={{ p: 1.5, maxWidth: { xs: '95%', sm: '85%' }, minWidth: 0, overflowWrap: 'anywhere', bgcolor: isSender ? 'primary.dark' : 'background.paper', touchAction: 'pan-y', WebkitTouchCallout: 'none' }}>
        {m?.reply && <Box component="button" type="button" disabled={!replyMessage} onClick={() => replyMessage && onReplyClick?.(m.reply!.targetId)} sx={{ display: 'block', width: '100%', textAlign: 'left', border: 0, borderLeft: '3px solid', borderColor: 'primary.light', borderRadius: 1, bgcolor: 'action.hover', color: 'inherit', p: 1, mb: 1, cursor: replyMessage ? 'pointer' : 'default' }} aria-label="Go to replied message">
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>{replyMessage ? replyMessage.fromUserId === userId ? 'You' : 'Original message' : 'Original message unavailable'}</Typography>
          <Typography variant="body2" noWrap>{replyMessage?.deleted ? 'Message deleted' : replyMessage?.content?.slice(0, 120) || replyMessage?.attachments?.[0]?.filename || 'Image'}</Typography>
        </Box>}
        {m?.pendingFilenames?.map(name => <Typography key={name} variant="caption" sx={{ display: 'block', overflowWrap: 'anywhere' }}>{name}</Typography>)}
        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.content ?? 'This message is unavailable on this device'}</Typography>
        {m && !m.deleted && userId && token && m.attachments?.map(secret => <Media key={secret.blobId} secret={secret} message={m} userId={userId} token={token} />)}
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto', maxWidth: '100%', mt: 0.5 }}>
          {onAction && !m?.deleted && <IconButton size="small" aria-label="Add reaction" disabled={!actionable} onClick={event => setEmojiAnchor(event.currentTarget)} sx={{ opacity: 0.55, flexShrink: 0 }}><AddReactionOutlined fontSize="small" /></IconButton>}
          {[...reactions].map(([emoji, users]) => <Chip key={emoji} size="small" label={`${emoji} ${users.size}`} clickable={actionable} disabled={!actionable} onClick={() => onAction?.('reaction', emoji)} color={userId && users.has(userId) ? 'primary' : 'default'} aria-label={`${emoji}: ${users.size} reactions${userId && users.has(userId) ? ', including yours' : ''}`} sx={{ flexShrink: 0 }} />)}
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end', alignItems: 'center', mt: 0.5 }}><Typography variant="caption">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{m?.revision ? ' · edited' : ''}</Typography>{isSender && (m?.sendingState === 'failed' ? <Typography variant="caption" color="error">Not sent</Typography> : m?.sendingState === 'sending' ? <Typography variant="caption">Sending…</Typography> : m?.queued ? <Typography variant="caption">Queued</Typography> : read ? <DoneAllOutlined aria-label="Read" sx={{ color: '#64b5f6' }} fontSize="small" /> : seen ? <DoneAllOutlined aria-label="Delivered" fontSize="small" /> : <CheckOutlined aria-label="Sent" fontSize="small" />)}</Stack>
      </Paper>
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        {isSender && !m?.deleted && <MenuItem onClick={() => select('edit')}>Edit</MenuItem>}
        {isSender && !m?.deleted && <MenuItem onClick={() => select('delete')}>Delete for everyone</MenuItem>}
        <MenuItem onClick={() => select('hide')}>Delete for me</MenuItem>
      </Menu>
      <Popover anchorEl={emojiAnchor} open={!!emojiAnchor} onClose={() => setEmojiAnchor(null)} anchorOrigin={{ vertical: 'top', horizontal: 'left' }} transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        {emojiAnchor && <EmojiPicker emojiStyle={EmojiStyle.NATIVE} theme={Theme.AUTO} width={Math.min(320, window.innerWidth - 24)} height={350} previewConfig={{ showPreview: false }} onEmojiClick={(data: EmojiClickData) => { setEmojiAnchor(null); onAction?.('reaction', data.emoji); }} />}
      </Popover>
    </Stack>;
}
