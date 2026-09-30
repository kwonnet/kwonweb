"use client";
import React, { useState } from "react";
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
import FeedSocialShare from "./FeedSocialShare";
import { FeedPost } from "@/types";
import { siteUrl } from "@/config";
import CreateQuoteDrawer from "./CreateQuoteDrawer";
import FeedCardItem from "./FeedCardItem";
import { useAuthSession, useFeedCacheUpdater, useLoadMore, usePostSseListeners } from "@/hooks";
import { FeedTypeEnum } from "@/types/post";
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

const UserBookmarksFeed = ({ posts, userId }: { posts: FeedPost[], userId: string }) => {

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
    if (pageIndex !== 0 && previousPageData && !previousPageData.length)
      return null; // Stop when no more data
    return {
      type: `${userId}_bookmarks_posts`,
      limit: PAGE_SIZE,
      page: pageIndex + 1,
      userId,
      kind: "bookmarks"
    };
  };

  const { data, error, isLoading, mutate, setSize } =
    useSWRInfinite(getKey, (args) => getUserPostsFeed(args, token), {
      keepPreviousData: true,
      refreshWhenOffline: false,
      revalidateOnReconnect: true,
      fallbackData: [posts],
    });

  const flatData = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length === 0) || !!error;

  const loadMore = () => {
    setSize((num) => num + 1);
  }
  // feed cache update
  const { mutatePostLikes, mutatePostBookmarks, mutatePostQuotes, mutatePostShares, mutatePostReposts, mutatePostAuthor } = useFeedCacheUpdater(mutate)

  // listen to sse streams
  usePostSseListeners(user, mutate, undefined, true)


  const handleReaction = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
    hasLiked: boolean
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    // handle local update
    mutatePostLikes({ id, liked: hasLiked });
    await postReaction(id, token);
  };

  const handleBookmark = async (
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
  };

  const handleRepost = async (ev: any, id: string, reposted: boolean) => {
    ev.preventDefault();
    ev.stopPropagation();
    // handle local update
    mutatePostReposts({ postId: id, reposted });
    await updateRePost(id, token);
  };

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
      url: `${siteUrl}/feed/${item.id}`,
      postId: item.id,
    }));
    toggleShareDrawer(ev, true);
  };

  const onSocialClick = async (id: string, kind?: string) => {
    console.log("share post ID ", id);
    mutatePostShares(id);
    const sessionId = getSessionId();
    const payload = {id, kind, sessionId, timestamp: new Date().toISOString()}
    await shareFeedPost(payload, token);
  };
  // follow user
  const onFollowUserCallback = (
    args: { senderId: string; recipientId: string, action: FollowAction }
  ) => {
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
      {isLoading ? null : !isReachingEnd ? <div ref={ref} style={{padding: "10px 0px 10px 0px"}} /> : <Typography variant="caption" textAlign={"center"} sx={{display: "block"}} color="textDisabled">No More Feed</Typography>}
      <Box sx={{display: 'block', textAlign: 'center'}}>
        {isLoading && <CircularProgress size={24} color="warning" />}
      </Box>
    </Box>
  );
};

export default UserBookmarksFeed;
