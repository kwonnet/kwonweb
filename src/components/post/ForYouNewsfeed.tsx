"use client";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import useSWR, { useSWRConfig } from "swr";
import {
  bookmarkPost,
  getNewsfeed,
  postReaction,
  shareFeedPost,
  updateRePost,
} from "@/lib/posts";
import { getErrorMessage } from "@/utils";
import FeedSkeleton from "./FeedSkeleton";
import JSConfetti from "js-confetti";
import FeedSocialShare from "./FeedSocialShare";
import { FeedPost } from "@/types";
import { siteUrl } from "@/config";
import FeedQuoteAction from "./FeedQuoteActionDrawer";
import CreateQuoteDrawer from "./CreateQuoteDrawer";
import FeedCardItem from "./FeedCardItem";
import { useAuthSession } from "@/hooks";
import { FeedTypeEnum } from "@/types/post";
import { useSSEContext } from "@/context/SSEContext";
import { updateUserFollower } from "@/lib/users";

type LocalState = {
  open: boolean;
  openQuote: boolean;
  hasReposted: boolean;
  isOpen: boolean;
  url: string;
  postId: string;
  post?: FeedPost;
};

const findCacheKey = (feedKey: string, cache: any) => {
  let cacheKey = null;
  for (const key of cache.keys()) {
    if (key.includes(feedKey)) {
      cacheKey = key;
      break;
    }
  }

  return cacheKey;
};

const ForYouNewsfeed = ({ posts }: { posts: FeedPost[] }) => {
  // const jsConfetti = new JSConfetti();

  const { token, user } = useAuthSession();

  const { sseSource } = useSSEContext();

  const { mutate, cache } = useSWRConfig();

  const feedKey = `foryou_feed_${user.id}`;

  const [state, setState] = useState<LocalState>({
    open: false,
    openQuote: false,
    hasReposted: false,
    isOpen: false,
    url: "",
    postId: "",
  });

  const { data, isLoading, error } = useSWR(
    feedKey,
    () => getNewsfeed(FeedTypeEnum.FORYOU, token),
    {
      fallbackData: posts,
      keepPreviousData: true,
      refreshWhenOffline: false,
    }
  );

  const mutateData = (updateFeedData: (feed: FeedPost[]) => FeedPost[]) => {
    const cacheKey = findCacheKey(feedKey, cache);
    mutate(
      cacheKey,
      (data?: FeedPost[]) => (data ? updateFeedData(data) : undefined),
      {
        optimisticData: (data?: any) =>
          data ? updateFeedData(data) : undefined,
        populateCache: true,
        rollbackOnError: true,
        revalidate: false,
      }
    );
  };

  const updatePostLikes = (
    args: { id: string; liked: boolean },
    local: boolean = true
  ) => {
    // check if it's global or local update
    // if local update, update if the user has liked or unliked but if global ignore
    const getFeedData = (cacheData: FeedPost[]) => {
      return cacheData?.map((d) => {
        if (d.id === args?.id) {
          d = {
            ...d,
            ...(local && { actions: { ...d.actions, hasLiked: args.liked } }),
            totalLikes: args.liked ? d.totalLikes + 1 : d.totalLikes - 1,
          };
        }
        if (d?.parent && d?.parentId === args.id) {
          d = {
            ...d,
            parent: {
              ...d.parent,
              ...(local && { actions: { ...d?.parent.actions, hasLiked: args.liked } }),
              totalLikes: args.liked
                ? d?.parent.totalLikes + 1
                : d?.parent.totalLikes - 1,
            },
          };
        }
        return d;
      });
    };
    mutateData(getFeedData);
  };

  const updatePostBookmarks = (
    args: { id: string; saved: boolean },
    local: boolean = true
  ) => {
    // check if it's global or local update
    // if local update, update if the user has liked or unliked but if global ignore
    const getFeedData = (cacheData: FeedPost[]) => {
      return cacheData?.map((d) => {
        if (d.id === args?.id) {
          d = {
            ...d,
            ...(local && { actions: { ...d.actions, hasSaved: args.saved } }),
            totalBookmarks: args.saved
              ? d.totalBookmarks + 1
              : d.totalBookmarks - 1,
          };
        }
        if (d?.parent && d?.parentId === args.id) {
          d = {
            ...d,
            parent: {
              ...d.parent,
              ...(local && { actions: { ...d?.parent.actions, hasSaved: args.saved } }),
              totalBookmarks: args.saved
                ? d?.parent.totalBookmarks + 1
                : d?.parent.totalBookmarks - 1,
            },
          };
        }
        return d;
      });
    };
    mutateData(getFeedData);
  };

  const updatePostReposts = (
    args: { id?: string; postId: string; reposted: boolean },
    local: boolean = true
  ) => {
    // id is the post  repost and can be undefined when a user first reposts
    // postId is the ID of the reposted post
    //
    // check if it's global or local update
    // if local update, update if the user has liked or unliked but if global ignore
    const calc = (val: number) => {
      return val < 1 ? 0 : val;
    };
    const getFeedData = (cacheData: FeedPost[]) => {
      let updated = cacheData?.map((d) => {
        if (d.id === args?.postId) {
          d = {
            ...d,
            ...(local && { actions: { ...d.actions, hasReposted: args.reposted } }),
            totalReposts: args.reposted
              ? d.totalReposts + 1
              : calc(d.totalReposts - 1),
          };
        }
        if (d?.parent && d?.parentId === args.postId) {
          d = {
            ...d,
            parent: {
              ...d.parent,
              ...(local && { actions: { ...d?.parent.actions, hasReposted: args.reposted } }),
              totalReposts: args.reposted
                ? d?.parent.totalReposts + 1
                : calc(d?.parent.totalReposts - 1),
            },
          };
        }
        return d;
      });
      // if a user undo the repost, filter out the post
      if (args.id && !args.reposted) {
        updated = updated.filter((p) => p.id !== args.id);
      }
      return updated;
    };
    mutateData(getFeedData);
  };

  const updatePostQuotes = (args: { id: string; quoted: boolean }) => {
    // check if it's global or local update
    // if local update, update if the user has liked or unliked but if global ignore
    const getFeedData = (cacheData: FeedPost[]) => {
      return cacheData?.map((d) => {
        if (d.id === args?.id) {
          d = {
            ...d,
            totalQuotes: args.quoted ? d.totalQuotes + 1 : d.totalQuotes - 1,
          };
        }
        if (d?.parent && d?.parentId === args.id) {
          d = {
            ...d,
            parent: {
              ...d.parent,
              totalQuotes: args.quoted
                ? d?.parent.totalQuotes + 1
                : d?.parent.totalQuotes - 1,
            },
          };
        }
        return d;
      });
    };
    mutateData(getFeedData);
  };

  const updatePostReplies = (args: { id: string; replied: boolean }) => {
    // check if it's global or local update
    // if local update, update if the user has liked or unliked but if global ignore
    const getFeedData = (cacheData: FeedPost[]) => {
      return cacheData?.map((d) => {
        if (d.id === args?.id) {
          d = {
            ...d,
            totalReplies: args.replied
              ? d.totalReplies + 1
              : d.totalReplies - 1,
          };
        }
        if (d?.parent && d?.parentId === args.id) {
          d = {
            ...d,
            parent: {
              ...d.parent,
              totalReplies: args.replied
                ? d?.parent.totalReplies + 1
                : d?.parent.totalReplies - 1,
            },
          };
        }
        return d;
      });
    };
    mutateData(getFeedData);
  };

  const updatePostShares = (id: string) => {
    // check if it's global or local update
    // if local update, update if the user has liked or unliked but if global ignore
    const getFeedData = (cacheData: FeedPost[]) => {
      return cacheData?.map((d) => {
        if (d.id === id) {
          d = { ...d, totalShares: d.totalShares + 1 };
        }
        if (d?.parent && d?.parentId === id) {
          d = {
            ...d,
            parent: { ...d.parent, totalShares: d?.parent.totalShares + 1 },
          };
        }
        return d;
      });
    };
    mutateData(getFeedData);
  };

  const updatePostAuthor = (userId: string, isFollow: boolean) => {
    // check if it's global or local update
    // if local update, update if the user has liked or unliked but if global ignore
    const getFeedData = (cacheData: FeedPost[]) => {
      return cacheData?.map((d) => {
        if (d.userId === userId) {
          d = {
            ...d,
            author: {
              ...d.author,
              conn: { ...d.author.conn, isFollowed: isFollow },
            },
          };
        }
        if (d?.parent && d?.parent?.author?.id === userId) {
          d = {
            ...d,
            parent: {
              ...d.parent,
              author: {
                ...d?.parent?.author,
                conn: { ...d?.parent?.author?.conn, isFollowed: isFollow },
              },
            },
          };
        }
        return d;
      });
    };
    mutateData(getFeedData);
  };

  const handleReaction = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
    hasLiked: boolean
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    // handle local update
    updatePostLikes({ id, liked: hasLiked });
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
    updatePostBookmarks({ id, saved: hasSaved });
    // api update
    await bookmarkPost(id, token);
  };

  const handleRepost = async (ev: any, id: string, reposted: boolean) => {
    ev.preventDefault();
    ev.stopPropagation();
    // handle local update
    updatePostReposts({ postId: id, reposted });
    await updateRePost(id, token);
  };

  const onQuoteCallback = (id: string, quoted: boolean) => {
    updatePostQuotes({ id, quoted });
  };

  const onQuoteClick = async (id: string) => {
    const post = data?.find((d) => d.id === id);
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
    updatePostShares(id);
    await shareFeedPost(id, token);
  };
  // follow user
  const onFollowUserCallback = (
    args: { senderId: string; recipientId: string },
    isFollow: boolean
  ) => {
    updatePostAuthor(args.recipientId, isFollow);
    // send to api
    updateUserFollower(args, token);
  };
  // listen to realtime events
  useEffect(() => {
    console.log("sseSource ", sseSource);
    // SSE stream to update post likes
    const likeListener = (ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      if (arg.userId !== user.id) {
        // handle stream update
        updatePostLikes(arg, false);
      }
    };
    sseSource?.addEventListener("post_reaction", likeListener);
    // SSE stream to update post bookmarks
    const bookmarkListener = (ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      if (arg.userId !== user.id) {
        // handle stream update
        updatePostBookmarks(arg, false);
      }
    };
    sseSource?.addEventListener("post_bookmark", bookmarkListener);
    // SSE stream to update post bookmarks
    const shareListener = (ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      if (arg.userId !== user.id) {
        // handle stream update
        updatePostShares(arg.id);
      }
    };
    sseSource?.addEventListener("post_share", shareListener);
    // SSE stream to update post reposts
    const repostListener = (ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      if (!arg.reposted || arg.userId !== user.id) {
        // handle stream update
        updatePostReposts(arg, false);
      }
    };
    sseSource?.addEventListener("post_repost", repostListener);
    // SSE stream to update post quotes
    const quoteListener = (ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      if (arg.userId !== user.id) {
        // handle stream update
        updatePostQuotes(arg);
      }
    };
    sseSource?.addEventListener("post_quote", quoteListener);
    // SSE stream to update post replies
    const replyListener = (ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      if (arg.userId !== user.id) {
        // handle stream update
        updatePostReplies(arg);
      }
    };
    sseSource?.addEventListener("post_reply", replyListener);

    // SSE stream to update user follower
    const followerListener = (ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      if (arg.senderId === user.id) {
        // handle stream update
        updatePostAuthor(arg.recipient, arg.isFollow);
      }
    };
    sseSource?.addEventListener("user_follower", followerListener);
    // clean up
    return () => {
      sseSource?.removeEventListener("post_reaction", likeListener);
      sseSource?.removeEventListener("post_bookmark", bookmarkListener);
      sseSource?.removeEventListener("post_share", shareListener);
      sseSource?.removeEventListener("post_repost", repostListener);
      sseSource?.removeEventListener("post_quote", quoteListener);
      sseSource?.removeEventListener("post_reply", replyListener);
      sseSource?.removeEventListener("user_follower", followerListener);
    };
  }, [sseSource]);

  if (isLoading && !data) {
    return <FeedSkeleton />;
  }
  if (error || !data) {
    return (
      <Box>
        <Typography>
          {error?.status === 404 ? "No feed yet" : getErrorMessage(error)}{" "}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      {data.map((item, index) => {
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

export default ForYouNewsfeed;
