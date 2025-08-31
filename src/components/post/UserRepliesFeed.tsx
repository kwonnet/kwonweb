"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import { CircularProgress, Paper, Typography } from "@mui/material";
import {
  bookmarkPost,
  postReaction,
  shareFeedPost,
  updateRePost,
} from "@/lib/posts";
import { getErrorMessage, removeProperty } from "@/utils";
import FeedSocialShare from "./FeedSocialShare";
import { FeedPost, PostKind } from "@/types";
import { siteUrl } from "@/config";
import CreateQuoteDrawer from "./CreateQuoteDrawer";
import {
  useAuthSession,
  useFeedCacheUpdater,
  useLoadMore,
  usePostSseListeners,
} from "@/hooks";
import { getUserPostsFeed, updateUserFollower } from "@/lib/users";
import useSWRInfinite from "swr/infinite";
import FeedCardReplyItem from "./FeedCardReplyItem";
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

const PAGE_SIZE = 21;

const UserRepliesFeed = ({
  posts,
  userId,
}: {
  posts: FeedPost[];
  userId: string;
}) => {
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
      type: `${userId}_replies_posts`,
      limit: PAGE_SIZE,
      page: pageIndex + 1,
      userId,
      kind: "replies",
    };
  };

  const { data, error, isLoading, mutate, setSize } = useSWRInfinite(
    getKey,
    (args) => getUserPostsFeed(args, token),
    {
      keepPreviousData: true,
      refreshWhenOffline: false,
      revalidateOnReconnect: true,
      fallbackData: [posts],
    }
  );

  const flatData = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length === 0) || !!error;

  const loadMore = () => {
    console.log("Load more called in newsfeed....");
    setSize((num) => num + 1);
  };
  // feed cache update
  const {
    mutatePostLikes,
    mutatePostBookmarks,
    mutatePostQuotes,
    mutatePostShares,
    mutatePostReposts,
    mutatePostAuthor,
  } = useFeedCacheUpdater(mutate);

  // listen to sse streams
  usePostSseListeners(user, mutate, undefined, true);

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

  const onSocialClick = async (id: string) => {
    console.log("share post ID ", id);
    mutatePostShares(id);
    await shareFeedPost(id, token);
  };
  // follow user
  const onFollowUserCallback = (args: {
    senderId: string;
    recipientId: string;
    action: FollowAction;
  }) => {
    mutatePostAuthor(args.recipientId, args.action);
    // send to api
    updateUserFollower(args, token);
  };
  // track load more posts
  const ref = useLoadMore(loadMore);

  console.log("User replies ", flatData);

  return (
    <Box sx={{ mt: 1 }}>
      {error && !data && !isLoading && (
        <Box>
          <Typography>
            {error?.status === 404 ? "No feed yet" : getErrorMessage(error)}{" "}
          </Typography>
        </Box>
      )}
      {flatData.map((post, idx) => {
        // const parentChain = post.parentChain;

        // const ancestoryChain = [...parentChain, { ...post, parent: null, parentChain: [] }];

        const parent = post.parent;

        return (
          <Box key={post.id} sx={{ mb: 1 }}>
            {/* {parent?.kind === PostKind.REPLY &&
              parent?.parent?.kind === PostKind.QUOTE && (
                <FeedCardReplyItem
                  post={post?.parent?.parent}
                  handleBookmark={handleBookmark}
                  handleReaction={handleReaction}
                  handleRepost={handleRepost}
                  handleShare={handleShare}
                  onQuote={onQuoteClick}
                  handleReply={() => {}}
                  onFollowUserCallback={onFollowUserCallback}
                  isDivider={false}
                  lastIndex={false}
                />
              )} */}
            <FeedCardReplyItem
              post={post?.parent}
              handleBookmark={handleBookmark}
              handleReaction={handleReaction}
              handleRepost={handleRepost}
              handleShare={handleShare}
              onQuote={onQuoteClick}
              handleReply={() => {}}
              onFollowUserCallback={onFollowUserCallback}
              showParent={true}
              isDivider={false}
              lastIndex={false}
            />
            <FeedCardReplyItem
              post={post}
              handleBookmark={handleBookmark}
              handleReaction={handleReaction}
              handleRepost={handleRepost}
              handleShare={handleShare}
              onQuote={onQuoteClick}
              handleReply={() => {}}
              onFollowUserCallback={onFollowUserCallback}
              showParent={false}
              isDivider={false}
              lastIndex={true}
            />
          </Box>
        );

        // return (
        //   <Paper key={idx} sx={{mb: 1}}>
        //     {ancestoryChain.map((item, index) => (
        //     <FeedCardReplyItem
        //       key={item.id}
        //       post={item}
        //       handleBookmark={handleBookmark}
        //       handleReaction={handleReaction}
        //       handleRepost={handleRepost}
        //       handleShare={handleShare}
        //       onQuote={onQuoteClick}
        //       onFollowUserCallback={onFollowUserCallback}
        //       isDivider={false}
        //       lastIndex={(ancestoryChain.length - 1) === index }
        //   />
        // ))}
        //   </Paper>
        // )
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
      {isLoading ? null : !isReachingEnd ? (
        <div ref={ref} style={{ padding: "10px 0px 10px 0px" }} />
      ) : (
        <Typography
          variant="caption"
          textAlign={"center"}
          sx={{ display: "block" }}
          color="textDisabled"
        >
          No More Feed
        </Typography>
      )}
      <Box sx={{ display: "block", textAlign: "center" }}>
        {isLoading && <CircularProgress size={24} color="warning" />}
      </Box>
    </Box>
  );
};

export default UserRepliesFeed;
