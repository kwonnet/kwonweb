"use client";
import { useNotifications } from "@/providers/NotificationsProvider";
import usePostInteractions from "@/hooks/usePostInteractions";
import useFeedCacheMutate from "@/hooks/useFeedCacheMutate";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import { CircularProgress, Typography } from "@mui/material";
import {
  shareFeedPost,
} from "@/lib/posts";
import { getErrorMessage, getSessionId } from "@/utils";
import FeedSocialShare from "./FeedSocialShare";
import { FeedPost } from "@/types";
import { siteUrl } from "@/config";
import CreateQuoteDrawer from "./CreateQuoteDrawer";
import { useAuthSession, useFeedCacheUpdater, useLoadMore, usePostSseListeners } from "@/hooks";
import { getUserPostsFeed, updateUserFollower } from "@/lib/users";
import useSWRInfinite from "swr/infinite";
import FeedCardPostItem from "./FeedCardPostItem";
import { FollowAction } from "@/types/user";

type LocalState = {
  open: boolean;
  openQuote: boolean;
  hasReposted: boolean;
  isOpen: boolean;
  url: string;
  postId: string;
  post?: FeedPost;
};

const PAGE_SIZE = 21

const UserHighlightsFeed = ({ posts, userId }: { posts: FeedPost[], userId: string }) => {

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
    if (pageIndex !== 0 && previousPageData && !previousPageData.length)
      return null; // Stop when no more data
    return {
      viewerId: user.id,
      type: `${userId}_highlights_posts`,
      limit: PAGE_SIZE,
      page: pageIndex + 1,
      userId,
      kind: "highlights"
    };
  };

  const { data, error, isLoading, mutate: mutatePages, setSize } =
    useSWRInfinite(getKey, (args) => getUserPostsFeed(args, token), {
      keepPreviousData: false,
      refreshWhenOffline: false,
      revalidateOnReconnect: true,
      fallbackData: [posts],
    });

  const mutate = useFeedCacheMutate(mutatePages, data);

  const flatData = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length === 0) || !!error;

  const loadMore = () => {
    console.log("Load more called in newsfeed....")
    setSize((num) => num + 1);
  }
  // feed cache update
  const { mutatePostLikes, mutatePostBookmarks, mutatePostQuotes, mutatePostShares, mutatePostReposts, mutatePostAuthor } = useFeedCacheUpdater(mutate)

  const { handleReaction, handleBookmark, handleRepost } = usePostInteractions(user.id, token, { mutatePostLikes, mutatePostBookmarks, mutatePostReposts }, mutate);

  // listen to sse streams
  usePostSseListeners(user, mutate, undefined, true, undefined, data)

  const onQuoteCallback = (id: string, quoted: boolean) => {
    mutatePostQuotes({ id, quoted });
  };

  const onQuoteClick = async (id: string) => {
    const post = flatData?.find((d) => d.id === id);
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
  const onFollowUserCallback = (
    args: { senderId: string; recipientId: string; action: FollowAction }  ) => {
    mutatePostAuthor(args.recipientId, args.action);
    // send to api
    updateUserFollower(args, token);
  };
  // track load more posts
  const ref = useLoadMore(loadMore)

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
            <FeedCardPostItem
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
      {isLoading ? null : !isReachingEnd ? <div ref={ref} style={{padding: "10px 0px 10px 0px"}} /> : <Typography
        variant="caption"
        color="textDisabled"
        sx={{
          textAlign: "center",
          display: "block"
        }}>No More Feed</Typography>}
      <Box sx={{display: 'block', textAlign: 'center'}}>
        {isLoading && <CircularProgress size={24} color="warning" />}
      </Box>
    </Box>
  );
};

export default UserHighlightsFeed;
