"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import { Button, Typography } from "@mui/material";
import {
  bookmarkPost,
  getPostReplies,
  postReaction,
  shareFeedPost,
  updateRePost,
} from "@/lib/posts";
import { getErrorMessage } from "@/utils";
import { FeedPost } from "@/types";
import { siteUrl } from "@/config";
import { useAuthSession, useFeedCacheUpdater, usePostSseListeners } from "@/hooks";
import { updateUserFollower } from "@/lib/users";
import useSWRInfinite from "swr/infinite";
import { debounce } from "lodash";
import {
  CreateQuoteDrawer,
  FeedCardItem,
  FeedSkeleton,
  FeedSocialShare,
} from "@/components/post";
import FeedAppBar from "../FeedAppBar";

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

const PageClient = ({
  posts,
  postId,
}: {
  postId: string;
  posts: FeedPost[];
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
      type: "post_hidden_replies",
      id: postId,
      userId: user.id,
      limit: PAGE_SIZE,
      page: pageIndex + 1,
      hidden: true,
    };
  };

  const { data, error, isLoading, isValidating, size, mutate, setSize } =
    useSWRInfinite(getKey, (args) => getPostReplies(args, token), {
      keepPreviousData: true,
      refreshWhenOffline: false,
      fallbackData: posts.length > 0 ? [posts] : undefined,
    });

  const flatData = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length < PAGE_SIZE) || !!error;
  // feed cache update
  const mutations = useFeedCacheUpdater(mutate);
  // listen to sse streams
  usePostSseListeners(user, mutate);

  const debouncedLoadMore = debounce(() => {
    setSize((num) => num + 1);
  }, 700);

  const handleReaction = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
    hasLiked: boolean
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    // handle local update
    mutations.mutatePostLikes({ id, liked: hasLiked });
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
    mutations.mutatePostBookmarks({ id, saved: hasSaved });
    // api update
    await bookmarkPost(id, token);
  };

  const handleRepost = async (ev: any, id: string, reposted: boolean) => {
    ev.preventDefault();
    ev.stopPropagation();
    // handle local update
    mutations.mutatePostReposts({ postId: id, reposted });
    await updateRePost(id, token);
  };

  const onQuoteCallback = (id: string, quoted: boolean) => {
    mutations.mutatePostQuotes({ id, quoted });
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
    mutations.mutatePostShares(id);
    await shareFeedPost(id, token);
  };
  // follow user
  const onFollowUserCallback = (
    args: { senderId: string; recipientId: string },
    isFollow: boolean
  ) => {
    mutations.mutatePostAuthor(args.recipientId, isFollow);
    // send to api
    updateUserFollower(args, token);
  };

  return (
    <Box sx={{
      "& .post_appbar": {
        position: {
          lg: "sticky !important",
          md: "sticky !important",
          sm: "absolute !important",
          xs: "absolute !important",
        },
        width: {
          lg: "auto",
          md: "auto",
          sm: "100%",
          xs: "100%",
        },
      },
    }}>
      <FeedAppBar />
      <Typography
        variant="subtitle1"
        color="textDisabled"
        sx={{ textAlign: "center", py: 1 }}
      >
        Hidden Replies
      </Typography>
      <Box>
        {(isLoading || isValidating) && !data && (
          <FeedSkeleton rows={3} height={120} items={3} />
        )}
      </Box>
      <Box>
        <Typography textAlign={"center"}>
          {error?.status === 404 ? "No quotes yet" : getErrorMessage(error)}{" "}
        </Typography>
      </Box>
      {flatData?.map((item) => {
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
        {flatData.length >= PAGE_SIZE && (
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
