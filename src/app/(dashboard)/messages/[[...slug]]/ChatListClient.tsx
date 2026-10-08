'use client'
import { useAuthSession } from '@/hooks';
import { getUserChatConversations } from '@/lib/conversations';
import debounce from 'lodash/debounce';
import React from 'react'
import useSWRInfinite from 'swr/infinite';
import DisplayChatList from './DisplayChatList';
import { Box, Button } from '@mui/material';
import { EncryptedConversation } from '@/types/conversation';

const PAGE_SIZE = 21

const ChatClientList = ({convoList, slug}: { convoList: EncryptedConversation[]; slug: string}) => {

    const { token, user } = useAuthSession();

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
      refreshInterval: 3000,
      refreshWhenOffline: false,
      fallbackData: convoList.length > 0 ? [convoList] : undefined,
    });

  const flatData = data ? data?.flat() : [];

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