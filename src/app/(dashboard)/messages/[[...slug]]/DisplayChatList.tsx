"use client";
import { useAuthSession } from "@/hooks";
import type { DecryptedConversation } from "@/types/conversation";
import { formatRelativeTime } from "@/utils";
import { CheckOutlined, DoneAllOutlined } from "@mui/icons-material";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

const ConvoListItem = ({ item }: { item: DecryptedConversation }) => {
  const { user } = useAuthSession();
  const router = useRouter(), pathname = usePathname();
  const peer = item.responder.id === user.id ? item.initiator.user : item.responder.user;
  const last = item.lastMessage;
  const sender = last?.fromUserId === user.id;
  const read = last?.read.some(receipt => receipt.userId === peer.id);
  const seen = last?.seen.some(receipt => receipt.userId === peer.id);
  const active = pathname.split('/')[2] === peer.id;
  const open = () => router.push(`/messages/${encodeURIComponent(peer.id)}/${pathname.includes('requests') ? 'requests' : item.kind}`);
  return <Box role="button" tabIndex={0} onClick={open} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } }} sx={{ display: 'grid', gridTemplateColumns: '48px minmax(0,1fr) 72px', gap: 1, alignItems: 'center', width: '100%', p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: active ? 'action.selected' : undefined, cursor: 'pointer' }}>
    <Avatar src={peer.avatar ?? undefined} alt={peer.name} sx={{ width: 48, height: 48 }}>{peer.name?.[0]}</Avatar>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>{peer.name}</Typography>
      <Typography variant="caption" noWrap color="text.secondary" sx={{ display: 'block' }}>@{peer.username}</Typography>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
        {sender && (read ? <DoneAllOutlined aria-label="Read" sx={{ color: '#64b5f6', fontSize: 16, flexShrink: 0 }} /> : seen ? <DoneAllOutlined aria-label="Delivered" sx={{ fontSize: 16, flexShrink: 0 }} /> : <CheckOutlined aria-label="Sent" sx={{ fontSize: 16, flexShrink: 0 }} />)}
        <Typography variant="caption" color="text.secondary" noWrap>{item.previewLoading ? 'Syncing preview…' : last?.content || 'Encrypted conversation'}</Typography>
      </Stack>
    </Box>
    <Stack sx={{ alignItems: 'flex-end', alignSelf: 'stretch', justifyContent: 'space-between', minWidth: 0, py: 0.5 }}>
      <Typography variant="caption" noWrap color={item.unreadCount > 0 ? 'info.main' : 'text.secondary'}>{formatRelativeTime(item.updatedAt)}</Typography>
      <Box sx={{ minHeight: 22 }}>{item.unreadCount > 0 && <Box aria-label={`${item.unreadCount} unread messages`} sx={{ minWidth: 22, height: 22, px: 0.5, borderRadius: 11, bgcolor: 'primary.main', color: 'primary.contrastText', textAlign: 'center', fontSize: 12, lineHeight: '22px', fontWeight: 600 }}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Box>}</Box>
    </Stack>
  </Box>;
};
export default function DisplayChatList({ convoList }: { convoList: DecryptedConversation[] }) {
  return <Box>{convoList.map(item => <ConvoListItem key={item.id} item={item} />)}</Box>;
}
