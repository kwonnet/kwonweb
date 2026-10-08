'use client';
import { useEffect, useState } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { DoneAllOutlined, CheckOutlined } from '@mui/icons-material';
import type { LocalMessage } from '@/lib/signal/contracts';
import type { DecryptedChatMessage } from '@/types/conversation';
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
export default function ChatBubble({ message, isSender, onAction, disabled, userId, token }: {
    message: LocalMessage | DecryptedChatMessage;
    isSender: boolean;
    onAction?: (kind: Action, value?: string) => void;
    disabled?: boolean;
    userId?: string;
    token?: string;
}) {
    const m = 'event' in message ? message : undefined;
    const seen = message.seen.some(r => r.userId === message.toUserId), read = message.read.some(r => r.userId === message.toUserId);
    return <Stack sx={{ mb: 1, alignItems: isSender ? 'flex-end' : 'flex-start' }}><Paper sx={{ p: 1.5, maxWidth: '85%', bgcolor: isSender ? 'primary.dark' : 'background.paper' }}><Stack direction="row" spacing={1}><Typography variant="caption">{new Date(message.createdAt).toLocaleTimeString()}{m?.revision ? ' · edited' : ''}</Typography>{isSender && (m?.queued ? <Typography variant="caption">Queued</Typography> : read ? <DoneAllOutlined color="info" fontSize="small"/> : seen ? <DoneAllOutlined color="disabled" fontSize="small"/> : <CheckOutlined fontSize="small"/>)}</Stack>
 {m?.reply && <Typography variant="caption">Reply to message {m.reply.targetId.slice(0, 8)}</Typography>}
 <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.content ?? 'This message is unavailable on this device'}</Typography>
 {m && !m.deleted && userId && token && m.attachments?.map(secret => <Media key={secret.blobId} secret={secret} message={m} userId={userId} token={token}/>)}
 {m && !m.deleted && <Stack direction="row" spacing={0.5}>{m.reactions.map(r => <Chip key={`${r.userId}:${r.reaction}`} size="small" label={r.reaction}/>)}</Stack>}
 {onAction && <Stack direction="row" sx={{ flexWrap: "wrap" }}>{!m?.deleted && <><Button size="small" disabled={disabled} onClick={() => onAction('reply')}>Reply</Button><Button size="small" disabled={disabled} onClick={() => onAction('reaction', '👍')}>👍</Button>{isSender && <><Button size="small" disabled={disabled} onClick={() => onAction('edit')}>Edit</Button><Button size="small" disabled={disabled} onClick={() => onAction('delete')}>Delete for everyone</Button></>}</>}<Button size="small" onClick={() => onAction('hide')}>Delete for me</Button></Stack>}
 </Paper></Stack>;
}
