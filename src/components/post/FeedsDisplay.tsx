"use client";
import { useNotifications } from "@toolpad/core";
import usePostInteractions from "@/hooks/usePostInteractions";
import useFeedCacheMutate from "@/hooks/useFeedCacheMutate";
import { newsfeedKey } from "@/utils/newsfeed-key";
import React, { useState, useMemo, useCallback } from "react";
import Box from "@mui/material/Box";
import { CircularProgress, Typography } from "@mui/material";
import {
  getNewsfeed,
  shareFeedPost,
} from "@/lib/posts";
import { getErrorMessage, getSessionId } from "@/utils";

import { FeedPost } from "@/types";
import { siteUrl } from "@/config";
import dynamic from "next/dynamic";
const FeedSocialShare = dynamic(() => import("./FeedSocialShare"), { ssr: false });
const CreateQuoteDrawer = dynamic(() => import("./CreateQuoteDrawer"), { ssr: false });
import FeedCardItem from "./FeedCardItem";
import { useAuthSession, useFeedCacheUpdater, useLoadMore, usePostSseListeners } from "@/hooks";
import { FeedTypeEnum } from "@/types/post";
import { updateUserFollower } from "@/lib/users";
import useSWRInfinite from "swr/infinite";
import { FollowAction } from "@/types/user";

type LocalState = {
  open: boolean;
  openQuote: boolean;
  hasReposted: boolean;
  isOpen: boolean;
  url: string;
  postId: string;
  quoteMounted?: boolean;
  post?: FeedPost;
};

const FeedsDisplay = ({ posts, feed }: { posts: FeedPost[], feed: FeedTypeEnum }) => {

  const { token, user } = useAuthSession();
  const notifications = useNotifications();

  const [state, setState] = useState<LocalState>({
    open: false,
    openQuote: false,
    hasReposted: false,
    isOpen: false,
    url: "",
    postId: "",
  });

  const getKey = (pageIndex: number, previousPageData?: FeedPost[]) => {
    if (!user?.id || !token) return null;
    if (pageIndex !== 0 && previousPageData && !previousPageData.length)
      return null; // Stop when no more data
    return newsfeedKey(user.id, feed, pageIndex);
  };

  const { data, error, isLoading, isValidating, size, mutate: mutatePages, setSize } =
    useSWRInfinite(getKey, (args) => getNewsfeed(args, token), {
      keepPreviousData: false,
      refreshWhenOffline: false,
      revalidateOnReconnect: true,
      fallbackData: [posts],
      revalidateOnMount: true,
      revalidateFirstPage: false,
    });

  const mutate = useFeedCacheMutate(mutatePages, data);

  const flatData = useMemo(() => [...new Map((data ?? [posts]).flat().map(item => [item.id, item])).values()], [data, posts]);

  const isReachingEnd =
    (data && data[data.length - 1]?.length === 0) || !!error;

  const loadingPage = isLoading || isValidating || !!(data && size > data.length);
  const loadMore = useCallback(() => {
    if (!loadingPage && !isReachingEnd) void setSize(num => num + 1);
  }, [loadingPage, isReachingEnd, setSize]);
  // feed cache update
  const { mutatePostLikes, mutatePostBookmarks, mutatePostQuotes, mutatePostShares, mutatePostReposts, mutatePostAuthor } = useFeedCacheUpdater(mutate)

  const { handleReaction, handleBookmark, handleRepost } = usePostInteractions(user.id, token, { mutatePostLikes, mutatePostBookmarks, mutatePostReposts }, mutate);

  // listen to sse streams
  usePostSseListeners(user, mutate, undefined, false, undefined, data)

  const onQuoteCallback = useCallback((id: string, quoted: boolean) => {
    mutatePostQuotes({ id, quoted });
  }, [mutatePostQuotes]);

  const onQuoteClick = useCallback(async (id: string) => {
    const post = flatData?.find((d) => d.id === id);
    setState((prev) => ({ ...prev, post, isOpen: true, quoteMounted: true }));
  }, [flatData]);

  const toggleDrawer = useCallback((ev: any, open: boolean) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, isOpen: open }));
  }, []);

  // sharing
  const toggleShareDrawer = useCallback((ev: any, open: boolean) => {
    ev.preventDefault();
    ev.stopPropagation();
    setState((prev) => ({ ...prev, open }));
  }, []);

  const handleShare = useCallback((ev: any, item: FeedPost) => {
    setState((prev) => ({
      ...prev,
      url: `${siteUrl}/${item.author.username}/feed/${item.id}`,
      postId: item.id,
    }));
    toggleShareDrawer(ev, true);
  }, [toggleShareDrawer]);

  const onSocialClick = useCallback(async (id: string, kind?: string) => {
    console.log("share post ID ", id);

    const sessionId = getSessionId();
    const payload = {id, kind, sessionId, timestamp: new Date().toISOString()}
    try {
      await shareFeedPost(payload, token);
      void mutate();
    } catch {
      notifications.show("Could not record the share. Please try again.", { severity: "error", autoHideDuration: 5000 });
    }
  }, [mutatePostShares, token, mutate, notifications]);
  // follow user
  const onFollowUserCallback = useCallback((
    args: { senderId: string; recipientId: string; action: FollowAction }
  ) => {
    mutatePostAuthor(args.recipientId, args.action);
    // send to api
    updateUserFollower(args, token);
  }, [mutatePostAuthor, token]);
  // track load more posts
  const ref = useLoadMore(loadMore, !loadingPage && !isReachingEnd)

  return (
    <Box sx={{ mt: 1 }}>
      {error && !data && (
      <Box>
        <Typography>
          {error?.status === 404 ? "No feed yet" : getErrorMessage(error)}{" "}
        </Typography>
      </Box>
    )}
      {flatData.map((item) => {
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
      {/* share post */}
      {state.open && <FeedSocialShare
        isOpen={state.open}
        url={state.url}
        postId={state.postId}
        toggleDrawer={toggleShareDrawer}
        onSocialClick={onSocialClick}
      />}
      {/* create post quote */}
      {state.quoteMounted && <CreateQuoteDrawer
        post={state.post}
        isOpen={state.isOpen}
        toggleDrawer={toggleDrawer}
        onQuoteCallback={onQuoteCallback}
        onFollowUserCallback={onFollowUserCallback}
      />}
      {!isReachingEnd ? <div ref={ref} style={{padding: "10px 0px 10px 0px"}} /> : <Typography variant="caption" textAlign={"center"} sx={{display: "block"}} color="textDisabled">No More Feed</Typography>}
      <Box sx={{display: 'block', textAlign: 'center'}}>
        {loadingPage && <CircularProgress size={24} color="warning" />}
      </Box>
    </Box>
  );
};

export default FeedsDisplay;
