"use client";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Button, Typography } from "@mui/material";
import useSWR, { useSWRConfig } from "swr";
import {
  bookmarkPost,
  getNewsfeed,
  getPostQuotes,
  getPostReplies,
  postReaction,
  shareFeedPost,
  updateRePost,
} from "@/lib/posts";
import { getErrorMessage } from "@/utils";
import JSConfetti from "js-confetti";
import { FeedPost } from "@/types";
import { siteUrl } from "@/config";
import { useAuthSession } from "@/hooks";
import { useSSEContext } from "@/context/SSEContext";
import { updateUserFollower } from "@/lib/users";
import useSWRInfinite from "swr/infinite";
import { debounce } from "lodash";
import { CreateQuoteDrawer, FeedCardItem, FeedSkeleton, FeedSocialShare } from "@/components/post";

type LocalState = {
  open: boolean;
  openQuote: boolean;
  hasReposted: boolean;
  isOpen: boolean;
  url: string;
  postId: string;
  post?: FeedPost;
};


const PAGE_SIZE = 1

const QuotesClient = ({ posts, postId }: { postId: string; posts: FeedPost[] }) => {

  const { token, user } = useAuthSession();

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
      type: "post_quotes",
      id: postId,
      userId: user.id,
      limit: PAGE_SIZE,
      page: pageIndex + 1,
    };
  };

  const { data, error, isLoading, isValidating, size, mutate, setSize } =
    useSWRInfinite(getKey, (args) => getPostQuotes(args, token), {
      keepPreviousData: true,
      refreshWhenOffline: false,
      fallbackData: posts.length > 0 ? [posts] : undefined,
    });

  const postQuotes = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length < PAGE_SIZE) || !!error;

  const debouncedLoadMore = debounce(() => {
    setSize((num) => num + 1);
  }, 700);


  const updatePostLikes = async (
      args: { id: string; liked: boolean },
      local: boolean = true
    ) => {
      const updateData = (_data: FeedPost[]) => {
        return _data.map((d) => {
          if (d.id === args.id) {
            d = {
              ...d,
              ...(local && { actions: { ...d?.actions, hasLiked: args.liked } }),
              totalLikes: !args.liked ? d.totalLikes - 1 : d.totalLikes + 1,
            };
          }
          if (d?.parent && d?.parentId === args.id) {
            d = {
              ...d,
              parent: {
                ...d.parent,
                ...(local && {
                  actions: { ...d?.parent?.actions, hasLiked: args.liked },
                }),
                totalLikes: args.liked
                  ? d.parent.totalLikes - 1
                  : d.parent.totalLikes + 1,
              },
            };
          }
          return d;
        });
      };
      // update post likes
      mutate((_data) => _data?.map((_d) => updateData(_d)), {
        revalidate: false,
        populateCache: true,
        rollbackOnError: true
      });
    }

  const updatePostBookmarks = (
      args: { id: string; saved: boolean },
      local: boolean = true
    ) => {
  
      const updateData = (_data: FeedPost[]) => {
        return _data.map((d) => {
          if (d.id === args.id) {
            d = {
              ...d,
              ...(local && { actions: { ...d?.actions, hasSaved: args.saved } }),
              totalBookmarks: !args.saved
                ? d.totalBookmarks - 1
                : d.totalBookmarks + 1,
            };
          }
          if (d?.parent && d?.parentId === args.id) {
            d = {
              ...d,
              parent: {
                ...d.parent,
                ...(local && {
                  actions: { ...d?.parent?.actions, hasSaved: args.saved },
                }),
                totalBookmarks: !args.saved
                  ? d.totalBookmarks - 1
                  : d.totalBookmarks + 1,
              },
            };
          }
          return d;
        });
      };
      // update post bookmarks
      mutate((_data) => _data?.map((_d) => updateData(_d)), {
        revalidate: false,
        populateCache: true,
        rollbackOnError: true
      });
    }

  const updatePostQuotes = async (args: { id: string; quoted: boolean }) => {
      const updateData = (_data: FeedPost[]) => {
        return _data.map((d) => {
          if (d.id === args.id) {
            d = {
              ...d,
              totalQuotes: !args.quoted ? d.totalQuotes - 1 : d.totalQuotes + 1,
            };
          }
          if (d?.parent && d?.parentId === args.id) {
            d = {
              ...d,
              parent: {
                ...d.parent,
                totalQuotes: !args.quoted ? d.totalQuotes - 1 : d.totalQuotes + 1,
              },
            };
          }
          return d;
        });
      };
      // update post quotes
      mutate((_data) => _data?.map((_d) => updateData(_d)), {
        revalidate: false,
        populateCache: true,
        rollbackOnError: true
      });
    }

  const updatePostReposts = async (
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
      const updateData = (_data: FeedPost[]) => {
        return _data.map((d) => {
          if (d.id === args.postId) {
            d = {
              ...d,
              ...(local && {
                actions: { ...d?.actions, hasReposted: args.reposted },
              }),
              totalReposts: !args.reposted
                ? calc(d.totalReposts - 1)
                : d.totalReposts + 1,
            };
          }
          if (d?.parent && d?.parentId === args.postId) {
            d = {
              ...d,
              parent: {
                ...d.parent,
                ...(local && {
                  actions: { ...d?.parent?.actions, hasReposted: args.reposted },
                }),
                totalReposts: !args.reposted
                  ? calc(d.totalReposts - 1)
                  : d.totalReposts + 1,
              },
            };
          }
          return d;
        });
      };
      // update post reposts
      mutate((_data) => _data?.map((_d) => updateData(_d)), {
        revalidate: false,
        populateCache: true,
        rollbackOnError: true
      });
    }

  const updatePostReplies = async (args: { id: string; userId: string, replied: boolean,  reply?: FeedPost }) => {
  
      const updateData = (_data: FeedPost[]) => {
        return _data.map((d) => {
          if (d.id === args.id) {
            d = {
              ...d,
              totalReplies: !args.replied
                ? d.totalReplies - 1
                : d.totalReplies + 1,
            };
          }
          if (d?.parent && d?.parentId === args.id) {
            d = {
              ...d,
              parent: {
                ...d.parent,
                totalReplies: !args.replied
                  ? d.totalReplies - 1
                  : d.totalReplies + 1,
              },
            };
          }
          return d;
        });
      };
      // update post reposts
      mutate((_data) => _data ? _data?.map((_d) => updateData(_d)): undefined, 
      { 
        optimisticData: (_data) => _data ? _data?.map((_d) => updateData(_d)) : [],
        revalidate: false,
        populateCache: true,
        rollbackOnError: true,
      });
    }

    const updatePostShares = debounce(async (id: string) => {
    
        const updateData = (_data: FeedPost[]) => {
          return _data.map((d) => {
            if (d.id === id) {
              d = { ...d, totalShares: d.totalShares + 1 };
            }
            if (d?.parent && d?.parentId === id) {
              d = { ...d, parent: { ...d.parent, totalShares: d.totalShares + 1 } };
            }
            return d;
          });
        };
        // update post shares
        mutate((_data) => _data?.map((_d) => updateData(_d)), {
          revalidate: false,
          populateCache: true,
          rollbackOnError: true
        });
      }
    )
  const updatePostAuthor = (userId: string, isFollow: boolean) => {
      const updateData = (_data: FeedPost[]) => {
        return _data.map((d) => {
          if (d?.userId === userId) {
            d = {
              ...d,
              author: {
                ...d?.author,
                conn: { ...d?.author.conn, isFollowed: isFollow },
              },
            };
          }
          if (d?.parent && d?.parent.userId === userId) {
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
      // update post author
      mutate((_data) => _data?.map((_d) => updateData(_d)), {
        revalidate: false,
        populateCache: true,
        rollbackOnError: true
      });
    }


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

  return (
    <Box sx={{ mt: 1 }}>
      <Box>
        {((isLoading || isValidating) && !data) && <FeedSkeleton rows={3} height={120} items={3} />}
      </Box>
      <Box>
        <Typography textAlign={"center"}>
          {error?.status === 404 ? "No quotes yet" : getErrorMessage(error)}{" "}
        </Typography>
      </Box>
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
        {postQuotes.length >= PAGE_SIZE && (<Button
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
        </Button>)}
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

export default QuotesClient;

