"use client";
import React, { useState, useMemo, useCallback } from "react";
import Box from "@mui/material/Box";
import { CircularProgress, Typography } from "@mui/material";
import {
  bookmarkPost,
  getNewsfeed,
  postReaction,
  shareFeedPost,
  updateRePost,
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

const PAGE_SIZE = 21

const FeedsDisplay = ({ posts, feed }: { posts: FeedPost[], feed: FeedTypeEnum }) => {

  const { token, user } = useAuthSession();

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
    return {
      // type: "foryou",
      userId: user.id,
      feed,
      limit: PAGE_SIZE,
      page: pageIndex + 1,
    };
  };

  const { data, error, isLoading, isValidating, size, mutate, setSize } =
    useSWRInfinite(getKey, (args) => getNewsfeed(args, token), {
      keepPreviousData: true,
      refreshWhenOffline: false,
      revalidateOnReconnect: true,
      fallbackData: [posts],
      revalidateOnMount: false,
      revalidateFirstPage: false,
    });

  const flatData = useMemo(() => [...new Map((data ?? [posts]).flat().map(item => [item.id, item])).values()], [data, posts]);

  const isReachingEnd =
    (data && data[data.length - 1]?.length === 0) || !!error;

  const loadingPage = isLoading || isValidating || !!(data && size > data.length);
  const loadMore = useCallback(() => {
    if (!loadingPage && !isReachingEnd) void setSize(num => num + 1);
  }, [loadingPage, isReachingEnd, setSize]);
  // feed cache update
  const { mutatePostLikes, mutatePostBookmarks, mutatePostQuotes, mutatePostShares, mutatePostReposts, mutatePostAuthor } = useFeedCacheUpdater(mutate)

  // listen to sse streams
  usePostSseListeners(user, mutate)


  const handleReaction = useCallback(async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
    hasLiked: boolean
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    // handle local update
    mutatePostLikes({ id, liked: hasLiked });
    await postReaction(id, token);
  }, [mutatePostLikes, token]);

  const handleBookmark = useCallback(async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
    hasSaved: boolean
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    // handle local update
    mutatePostBookmarks({ id, saved: hasSaved });
    // api update
    await bookmarkPost(id, token);
  }, [mutatePostBookmarks, token]);

  const handleRepost = useCallback(async (ev: any, id: string, reposted: boolean) => {
    ev.preventDefault();
    ev.stopPropagation();
    // handle local update
    mutatePostReposts({ postId: id, reposted });
    await updateRePost(id, token);
  }, [mutatePostReposts, token]);

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
      url: `${siteUrl}/feed/${item.id}`,
      postId: item.id,
    }));
    toggleShareDrawer(ev, true);
  }, [toggleShareDrawer]);

  const onSocialClick = useCallback(async (id: string, kind?: string) => {
    console.log("share post ID ", id);
    mutatePostShares(id);
    const sessionId = getSessionId();
    const payload = {id, kind, sessionId, timestamp: new Date().toISOString()}
    await shareFeedPost(payload, token);
  }, [mutatePostShares, token]);
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
