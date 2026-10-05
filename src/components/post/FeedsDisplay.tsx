"use client";
import { useNotifications } from "@/providers/NotificationsProvider";
import usePostInteractions from "@/hooks/usePostInteractions";
import useFeedCacheMutate from "@/hooks/useFeedCacheMutate";
import { newsfeedKey } from "@/utils/newsfeed-key";
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import { Button, CircularProgress, Typography } from "@mui/material";
import {
  searchPosts,
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
import useSWRInfinite, { unstable_serialize as serializeInfinite } from "swr/infinite";
import { useSWRConfig, unstable_serialize } from "swr";
import { missingFeedEntries } from "@/utils/seed-feed-cache";
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

const FeedsDisplay = ({ posts, feed, search }: { posts: FeedPost[], feed: FeedTypeEnum; search?: { q: string; tab: "top" | "latest" } }) => {

  const { token, user } = useAuthSession();
  const notifications = useNotifications();
  const { cache, mutate: mutateCache } = useSWRConfig();

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
    return search ? { ...newsfeedKey(user.id, feed, pageIndex), searchQuery: search.q, searchTab: search.tab } : newsfeedKey(user.id, feed, pageIndex);
  };

  const { data, error, isValidating, size, mutate: mutatePages, setSize } =
    useSWRInfinite(getKey, (args) => search ? searchPosts({ q: search.q, tab: search.tab, page: args.page, limit: args.limit }, token).then(result => result.posts) : getNewsfeed(args, token), {
      keepPreviousData: false,
      refreshWhenOffline: false,
      revalidateOnReconnect: true,
      fallbackData: [posts],
      // The server already fetched this page. Avoid a second recommendation request.
      revalidateOnMount: false,
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    });

  useEffect(() => {
    if (!user?.id || search) return;
    const pageKey = unstable_serialize(newsfeedKey(user.id, feed, 0));
    const listKey = serializeInfinite(index => newsfeedKey(user.id, feed, index));
    for (const [key, value] of missingFeedEntries(cache, pageKey, listKey, posts)) {
      void mutateCache(key, value, { revalidate: false });
    }
  }, [cache, mutateCache, user?.id, feed, posts, search]);

  const mutate = useFeedCacheMutate(mutatePages, data);

  const flatData = useMemo(() => [...new Map((data ?? [posts]).flat().map(item => [item.id, item])).values()], [data, posts]);

  const lastPage = data?.[data.length - 1];
  const isReachingEnd = search ? !!lastPage && lastPage.length < 21 : lastPage?.length === 0;
  // A background refresh must not replace existing cards with a loading state.
  const loadingPage = !error && !!(data && size > data.length);
  const requestingPage = useRef(false);
  const loadMore = useCallback(async () => {
    if (requestingPage.current || isValidating || loadingPage || isReachingEnd || error) return;
    requestingPage.current = true;
    try {
      await setSize(num => num + 1);
    } catch {
      // SWR exposes the failure below; keep existing posts and allow retry.
    } finally {
      requestingPage.current = false;
    }
  }, [loadingPage, isValidating, isReachingEnd, error, setSize]);
  const retryPage = async () => {
    if (requestingPage.current || isValidating) return;
    requestingPage.current = true;
    try {
      // Retry the requested size, never increment past a failed page.
      await setSize(size);
    } catch {
      // Keep the retry action available if the connection is still unavailable.
    } finally {
      requestingPage.current = false;
    }
  };
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
  }, [token, mutate, notifications]);
  // follow user
  const onFollowUserCallback = useCallback(async (
    args: { senderId: string; recipientId: string; action: FollowAction }
  ) => {
    mutatePostAuthor(args.recipientId, args.action);
    try {
      await updateUserFollower(args, token);
      // Re-read the relationship feeds after following or unfollowing an author.
      if (feed === FeedTypeEnum.FOLLOWING || feed === FeedTypeEnum.FRIENDS) await mutatePages();
    } catch (error) {
      void mutatePages().catch(() => undefined);
      notifications.show(getErrorMessage(error), { severity: "error", autoHideDuration: 5000 });
    }
  }, [mutatePostAuthor, token, feed, mutatePages, notifications]);
  // track load more posts
  const ref = useLoadMore(loadMore, !loadingPage && !isValidating && !isReachingEnd && !error, "0px 0px 1600px 0px")

  return (
    <Box sx={{ mt: 1 }}>
      {error && !data && (
      <Box>
        <Typography>
          {error?.status === 404 ? "No feed yet" : getErrorMessage(error)}{" "}
        </Typography>
      </Box>
    )}
      {!flatData.length && !error && <Box sx={{ py: 6, px: 2, textAlign: "center" }}>
        <Typography color="text.secondary">
          {search ? `No results for “${search.q}”. Try another search.` : feed === FeedTypeEnum.FOLLOWING ? "Posts from people you follow will appear here." :
           feed === FeedTypeEnum.FRIENDS ? "Posts from people who follow you back will appear here." :
           feed === FeedTypeEnum.TRENDING ? "No trending posts in the last three days yet." : "No posts to show yet."}
        </Typography>
      </Box>}
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
      {error && <Box role="alert" sx={{ textAlign: "center", py: 2 }}>
        <Typography>Couldn’t load more posts. Your feed is still here.</Typography>
        <Button onClick={retryPage} disabled={isValidating}>Retry loading posts</Button>
      </Box>}
      {!isReachingEnd ? <div ref={ref} style={{padding: "10px 0px 10px 0px"}} /> : <Typography
        variant="caption"
        color="textDisabled"
        sx={{
          textAlign: "center",
          display: "block"
        }}>No More Feed</Typography>}
      <Box sx={{display: 'block', textAlign: 'center'}}>
        {(loadingPage || (error && isValidating)) && <CircularProgress size={24} aria-label="Loading more posts" />}
      </Box>
    </Box>
  );
};

export default FeedsDisplay;
