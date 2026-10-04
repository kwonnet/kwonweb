"use client";
import { useNotifications } from "@/providers/NotificationsProvider";
import usePostInteractions from "@/hooks/usePostInteractions";
import useFeedCacheMutate from "@/hooks/useFeedCacheMutate";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Button, Typography } from "@mui/material";
import {
  getPostQuotes,
  shareFeedPost,
} from "@/lib/posts";
import { getErrorMessage, getSessionId } from "@/utils";
import { FeedPost } from "@/types";
import { siteUrl } from "@/config";
import {
  useAuthSession,
  useFeedCacheUpdater,
  usePostSseListeners,
} from "@/hooks";
import { useSSEContext } from "@/context/SSEContext";
import { updateUserFollower } from "@/lib/users";
import useSWRInfinite from "swr/infinite";
import { debounce } from "lodash";
import CreateQuoteDrawer from "@/components/post/CreateQuoteDrawer";
import FeedCardItem from "@/components/post/FeedCardItem";
import FeedSkeleton from "@/components/post/FeedSkeleton";
import FeedSocialShare from "@/components/post/FeedSocialShare";
import { FollowAction } from "@/types/user";
import DisplayError from "@/components/common/DisplayError";

type LocalState = {
  open: boolean;
  openQuote: boolean;
  hasReposted: boolean;
  isOpen: boolean;
  url: string;
  postId: string;
  post?: FeedPost;
};

const PAGE_SIZE = 1;

const PageClient = ({
  posts,
  postId,
}: {
  postId: string;
  posts: FeedPost[];
}) => {
  const { token, user } = useAuthSession();
  const notifications = useNotifications();

  const { sseSource } = useSSEContext();

  const [state, setState] = useState<LocalState>({
    open: false,
    openQuote: false,
    hasReposted: false,
    isOpen: false,
    url: "",
    postId: "",
  });

  const getKey = (pageIndex: number, previousPageData?: FeedPost[]) => {
    if (pageIndex !== 0 && previousPageData && !previousPageData.length)
      return null; // Stop when no more data
    return {
      viewerId: user.id,
      type: `${postId}-post-quotes`,
      id: postId,
      userId: user.id,
      limit: PAGE_SIZE,
      page: pageIndex + 1,
    };
  };

  const { data, error, isLoading, isValidating, size, mutate: mutatePages, setSize } =
    useSWRInfinite(getKey, (args) => getPostQuotes(args, token), {
      keepPreviousData: false,
      refreshWhenOffline: false,
      fallbackData: posts.length > 0 ? [posts] : undefined,
    });

  const mutate = useFeedCacheMutate(mutatePages, data);

  const postQuotes = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length < PAGE_SIZE) || !!error;

  // feed cache update
  const mutations = useFeedCacheUpdater(mutate);
  const { handleReaction, handleBookmark, handleRepost } = usePostInteractions(user.id, token, mutations, mutate);

  // listen to sse streams
  usePostSseListeners(user, mutate, undefined, false, undefined, data);

  const debouncedLoadMore = debounce(() => {
    setSize((num) => num + 1);
  }, 700);

  const onQuoteCallback = (id: string, quoted: boolean) => {
    mutations.mutatePostQuotes({ id, quoted });
  };

  const onQuoteClick = async (id: string) => {
    const post = postQuotes?.find((d) => d.id === id);
    setState((prev) => ({ ...prev, post, isOpen: true }));
  };

  const toggleDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, isOpen: open }));
  };

  // sharing
  const toggleShareDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    ev.stopPropagation();
    setState((prev) => ({ ...prev, open }));
  };

  const handleShare = (ev: any, item: FeedPost) => {
    setState((prev) => ({
      ...prev,
      url: `${siteUrl}/${item.author.username}/feed/${item.id}`,
      postId: item.id,
    }));
    toggleShareDrawer(ev, true);
  };

  const onSocialClick = async (id: string, kind?: string) => {
    console.log("share post ID ", id);

    const sessionId = getSessionId();
    const payload = {id, kind, sessionId, timestamp: new Date().toISOString()}
    try {
      await shareFeedPost(payload, token);
      void mutate();
    } catch {
      notifications.show("Could not record the share. Please try again.", { severity: "error", autoHideDuration: 5000 });
    }
  };
  // follow user
  const onFollowUserCallback = (args: {
    senderId: string;
    recipientId: string;
    action: FollowAction;
  }) => {
    mutations.mutatePostAuthor(args.recipientId, args.action);
    // send to api
    updateUserFollower(args, token);
  };

  return (
    <Box sx={{ mt: 1, px: 1 }}>
      <Box>
        {isLoading && !data && (
          <FeedSkeleton rows={3} height={120} items={3} />
        )}
      </Box>
      {error && !data && (
        <DisplayError status={error?.status} message={getErrorMessage(error)} />
      )}
      {postQuotes?.map((item) => {
        return (
          <FeedCardItem
            key={item.id}
            post={item}
            handleBookmark={handleBookmark}
            handleReaction={handleReaction}
            handleRepost={handleRepost}
            handleShare={handleShare}
            onQuoteClick={onQuoteClick}
            onFollowUserCallback={onFollowUserCallback}
          />
        );
      })}
      <Box sx={{ my: 2, textAlign: "center" }}>
        {postQuotes.length >= PAGE_SIZE && (
          <Button
            size="small"
            disabled={isReachingEnd}
            loading={isLoading}
            onClick={(ev) => {
              ev.preventDefault();
              debouncedLoadMore();
            }}
            sx={{ borderRadius: 30, textTransform: "capitalize" }}
            variant="outlined"
          >
            Show more
          </Button>
        )}
      </Box>
      {/* share post */}
      <FeedSocialShare
        isOpen={state.open}
        url={state.url}
        postId={state.postId}
        toggleDrawer={toggleShareDrawer}
        onSocialClick={onSocialClick}
      />
      {/* create post quote */}
      <CreateQuoteDrawer
        post={state.post}
        isOpen={state.isOpen}
        toggleDrawer={toggleDrawer}
        onQuoteCallback={onQuoteCallback}
        onFollowUserCallback={onFollowUserCallback}
      />
    </Box>
  );
};

export default PageClient;
