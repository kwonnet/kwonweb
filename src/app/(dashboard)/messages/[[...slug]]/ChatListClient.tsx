'use client'
import {useConvoSocketIoContext} from '@/context/ConvoSocketIoContext';
import { useAuthSession } from '@/hooks';
import { getUserChatConversations } from '@/lib/conversations';
import debounce from 'lodash/debounce';
import React from 'react'
import useSWRInfinite from 'swr/infinite';
import DisplayChatList from './DisplayChatList';
import { Box, Button } from '@mui/material';
import { EncryptedConversation } from '@/types/conversation';

const PAGE_SIZE = 21

const ChatClientList = ({convoList, slug, initialFetchFailed = false}: { convoList: EncryptedConversation[]; slug: string; initialFetchFailed?: boolean }) => {

    const { token, user } = useAuthSession();

    const {liveReady, revision, inboxRevision, conversationUpdates, receiptTotals, messages, warmConversations, ready}=useConvoSocketIoContext();
    const userId = user.id

  const getKey = (pageIndex: number, previousPageData?: any[]) => {
    if (pageIndex !== 0 && previousPageData && !previousPageData.length)
      return null; // Stop when no more data
    return {
      type: `${userId}_convo`,
      kind: slug,
      userId: user.id,
      limit: PAGE_SIZE,
      page: pageIndex + 1,
    };
  };

  const { data, error, isLoading, isValidating, size, mutate, setSize } =
    useSWRInfinite(getKey, (args) => getUserChatConversations(args, token), {
      keepPreviousData: false,
      revalidateAll: true,
      refreshInterval: liveReady ? 120000 : 30000,
      refreshWhenOffline: false,
      fallbackData: [convoList],
      revalidateOnMount: initialFetchFailed,
      revalidateFirstPage: false,
    });

  const flatData = data ? data.flat().map(item => ({ ...item, lastMessage: messages?.filter(message => message.conversation === item.id).at(-1) })) : [];
  React.useEffect(() => { if (ready && data) warmConversations(data.flat()); }, [data, ready, warmConversations]);

  const lastInboxRevision = React.useRef(inboxRevision);
  React.useEffect(() => {
    // SWRInfinite owns an aggregate cache in addition to its page caches.
    // Patch known rows in place; only unknown/new conversations require a list fetch.
    const revalidate = inboxRevision === undefined || lastInboxRevision.current !== inboxRevision;
    lastInboxRevision.current = inboxRevision;
    if (revision) void mutate(pages => pages?.map(page => page.map(item => {
      const update = conversationUpdates?.[item.id];
      return { ...item, ...update, ...receiptTotals?.[item.id],
        initiator: { ...item.initiator, ...update?.initiator, user: item.initiator.user },
        responder: { ...item.responder, ...update?.responder, user: item.responder.user },
      };
    })), { revalidate }).catch(() => {});
  }, [revision, inboxRevision, mutate, receiptTotals, conversationUpdates]);

  const isReachingEnd =
    (data && data[data.length - 1]?.length < PAGE_SIZE) || !!error;

  const debouncedLoadMore = debounce(() => {
    setSize((num) => num + 1);
  }, 700);

  return (
    <React.Fragment>
        <DisplayChatList convoList={flatData} />
        <Box sx={{ my: 2, textAlign: "center" }}>
        {flatData.length >= PAGE_SIZE && (
          <Button
            size="small"
            disabled={isReachingEnd}
            loading={isLoading}
            onClick={(ev) => {
              ev.preventDefault();
              debouncedLoadMore();
            }}
            sx={{ borderRadius: 30, fontSize: 12, textTransform: "capitalize" }}
            variant="outlined"
          >
            Show more
          </Button>
        )}
      </Box>
    </React.Fragment>
  )
}

export default ChatClientList
