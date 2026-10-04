"use client";

import { FeedPost, FeedPostDetail, SwrGenericMutateFunction } from "@/types";
import { FollowAction, FollowStatus } from "@/types/user";
import { getFollowStatus } from "@/utils/connections";
import { User } from "next-auth";
import { useCallback } from "react";
import { updateReaction } from "@/utils/post-reactions";

type UpdateFeedData = (feed: FeedPost[]) => FeedPost[];

const useFeedMutations = (
  mutate: SwrGenericMutateFunction<FeedPost>,
  setState?: (value: React.SetStateAction<any>) => void
) => {
  const mutateData = useCallback(
    (
      updateFeedData: UpdateFeedData,
      optimisticUpdate?: (_data?: FeedPost[][]) => FeedPost[][]
    ) => {
      mutate(
        optimisticUpdate
          ? optimisticUpdate
          : (_data: FeedPost[][] | undefined) =>
              _data?.map((_d) => updateFeedData(_d)),
        {
          revalidate: false,
          populateCache: true,
          rollbackOnError: true,
          optimisticData: optimisticUpdate,
        }
      );
    },
    [mutate]
  );

  /**
   * Update post likes and return posts
   * @param feed FeedPost[]
   * @param args object
   * @param local boolean
   * @returns FeedPost[]
   */
  const updatePostLikes = (
    feed: FeedPost[] | FeedPostDetail[],
    args: { id: string; liked: boolean },
    local: boolean = true
  ): FeedPost[] => {
    const updated = (feed ?? []).map(post => updateReaction(post, args.id, "like", args.liked, local));
    return updated;
  };

  /**
   * SWR mutate post likes
   */
  const mutatePostLikes = useCallback(
    (args: { id: string; liked: boolean }, local: boolean = true) => {
      const update = (feed: FeedPost[]) => updatePostLikes(feed, args, local);
      mutateData(update);
      if (!setState) return;
      setState((prev: any) => {
        const feedPost = updatePostLikes([prev.feedPost], args, local)[0] as FeedPostDetail;
        const thread = updatePostLikes(feedPost?.thread, args, local);
        const replies = updatePostLikes(feedPost?.replies, args, local);
        const parentChain = updatePostLikes(feedPost?.parentChain, args, local);
        return {
          ...prev,
          feedPost: {
            ...feedPost,
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  /**
   * Update post bookmarks and return posts
   * @param feed FeedPost[]
   * @param args object
   * @param local boolean
   * @returns FeedPost[]
   */
  const updatePostBookmarks = (
    feed: FeedPost[],
    args: { id: string; saved: boolean },
    local: boolean = true
  ): FeedPost[] => {
    const updated = (feed ?? []).map(post => updateReaction(post, args.id, "bookmark", args.saved, local));
    return updated;
  };

  /**
   * SWR mutate post bookmarks
   */
  const mutatePostBookmarks = useCallback(
    (args: { id: string; saved: boolean }, local: boolean = true) => {
      const update = (feed: FeedPost[]) =>
        updatePostBookmarks(feed, args, local);
      mutateData(update);
      if (!setState) return;
      setState((prev: any) => {
        const feedPost = updatePostBookmarks([prev.feedPost], args, local)[0] as FeedPostDetail;
        const thread = updatePostBookmarks(feedPost?.thread, args, local);
        const replies = updatePostBookmarks(feedPost?.replies, args, local);
        const parentChain = updatePostBookmarks(
          feedPost?.parentChain,
          args,
          local
        );
        return {
          ...prev,
          feedPost: {
            ...feedPost,
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  /**
   * Update post pins and highlight and posts
   * @param feed FeedPost[]
   * @param args object
   * @returns FeedPost[]
   */
  const updatePostPinAndHighlight = (
    feed: FeedPost[],
    args: { id: string; hasPinned?: boolean; hasHighlighted?: boolean }
  ): FeedPost[] => {
    return (feed ?? []).map((d) => {
      if (d.id === args.id) {
        return {
          ...d,
          actions: { ...d.actions, ...args },
        };
      }
      if (d.parent && d.parentId === args.id) {
        return {
          ...d,
          parent: {
            ...d.parent,
            actions: { ...d.actions, ...args },
          },
        };
      }
      return d;
    });
  };

  /**
   * SWR mutate post pins and highlight
   */
  const mutatePostPinAndHighlight = useCallback(
    (args: { id: string; hasPinned?: boolean; hasHighlighted?: boolean }) => {
      const update = (feed: FeedPost[]) =>
        updatePostPinAndHighlight(feed, args);
      mutateData(update);
      if (!setState) return;
      setState((prev: any) => {
        let feedPost = prev.feedPost;
        if (args?.id === feedPost?.id) {
          const _feedPost = updatePostPinAndHighlight([feedPost], args);
          feedPost = { ...feedPost, ..._feedPost[0] };
        }
        const thread = updatePostPinAndHighlight(feedPost?.thread, args);
        const replies = updatePostPinAndHighlight(feedPost?.replies, args);
        const parentChain = updatePostPinAndHighlight(
          feedPost?.parentChain,
          args
        );
        return {
          ...prev,
          feedPost: {
            ...feedPost,
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  /**
   * Update post reposts and return posts
   * @param feed FeedPost[]
   * @param args object
   * @param local boolean
   * @returns FeedPost[]
   */
  const updatePostReposts = (
    feed: FeedPost[],
    args: { childId?: string; postId: string; reposted: boolean },
    local: boolean = true
  ): FeedPost[] => {
    const updated = (feed ?? []).map(post => updateReaction(post, args.postId, "repost", args.reposted, local));
    return args.childId && !args.reposted ? updated.filter(post => post.id !== args.childId) : updated;
  };

  /**
   * SWR mutate post reposts
   */
  const mutatePostReposts = useCallback(
    (
      args: { childId?: string; postId: string; reposted: boolean },
      local: boolean = true
    ) => {
      if (setState) {
        setState((prev: any) => {
          const feedPost = updatePostReposts([prev.feedPost], args, local)[0] as FeedPostDetail;
          const thread = updatePostReposts(feedPost?.thread, args, local);
          const replies = updatePostReposts(feedPost?.replies, args, local);
          const parentChain = updatePostReposts(
            feedPost?.parentChain,
            args,
            local
          );

          return {
            ...prev,
            feedPost: {
              ...feedPost,
              thread,
              replies,
              parentChain,
            },
          };
        });
      }
      // mutate swr if any
      const update = (feed: FeedPost[]) => updatePostReposts(feed, args, local);
      mutateData(update);
    },
    [mutateData, setState]
  );

  /**
   * Update post quotes and return posts
   * @param feed FeedPost[]
   * @param args object
   * @returns FeedPost[]
   */
  const updatePostQuotes = (
    feed: FeedPost[],
    args: { id: string; quoted: boolean }
  ): FeedPost[] => {
    return (feed ?? []).map((d) => {
      if (d.id === args.id) {
        return {
          ...d,
          totalQuotes: args.quoted ? d.totalQuotes + 1 : d.totalQuotes - 1,
        };
      }
      if (d.parent && d.parentId === args.id) {
        return {
          ...d,
          parent: {
            ...d.parent,
            totalQuotes: args.quoted
              ? d.parent.totalQuotes + 1
              : d.parent.totalQuotes - 1,
          },
        };
      }
      return d;
    });
  };

  /**
   * SWR mutate post quotes
   */
  const mutatePostQuotes = useCallback(
    (args: { id: string; quoted: boolean }) => {
      const update = (feed: FeedPost[]) => updatePostQuotes(feed, args);
      mutateData(update);
      if (!setState) return;
      setState((prev: any) => {
        let feedPost = prev.feedPost;
        if (args?.id === feedPost?.id) {
          const _feedPost = updatePostQuotes([feedPost], args);
          feedPost = { ...feedPost, ..._feedPost[0] };
        }
        const thread = updatePostQuotes(feedPost?.thread, args);
        const replies = updatePostQuotes(feedPost?.replies, args);
        const parentChain = updatePostQuotes(feedPost?.parentChain, args);
        return {
          ...prev,
          feedPost: {
            ...feedPost,
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  /**
   * Update post replies and return posts
   * @param feed FeedPost[]
   * @param args object
   * @returns FeedPost[]
   */
  const updatePostReplies = (
    feed: FeedPost[],
    args: {
      id?: string;
      userId?: string;
      activePostId?: string;
      replied?: boolean;
      reply?: FeedPost;
    },
    user?: User
  ): FeedPost[] => {
    let updated = (feed ?? []).map((d) => {
      if (d.id === args.id) {
        return {
          ...d,
          totalReplies: args.replied ? d.totalReplies + 1 : d.totalReplies - 1,
        };
      }
      if (d.parent && d.parentId === args.id) {
        return {
          ...d,
          parent: {
            ...d.parent,
            totalReplies: args.replied
              ? d.parent.totalReplies + 1
              : d.parent.totalReplies - 1,
          },
        };
      }
      return d;
    });
    if (
      args.reply &&
      args.activePostId === args.id &&
      args.userId === user?.id
    ) {
      updated = [args.reply, ...updated];
    }
    return updated;
  };

  /**
   * SWR mutate post replies
   */
  const mutatePostReplies = useCallback(
    (
      args: {
        id?: string;
        userId?: string;
        reply?: FeedPost;
        replied?: boolean;
      },
      user?: User
    ) => {
      const update = (feed: FeedPost[]) => updatePostReplies(feed, args);

      const optimisticUpdate = (_data?: FeedPost[][]) => {
        if (_data) {
          const updated = _data?.map((_d) => update(_d));
          // insert if it's the current active post
          const item = updated[0][0];
          if (
            args.reply &&
            item?.parentId === args.id &&
            args.userId === user?.id
          ) {
            updated[0].unshift(args.reply);
          }
          return updated;
        }
        if (!_data && args.reply) [[args.reply]];
        return [];
      };
      mutateData(update, optimisticUpdate);
      if (!setState) return;
      setState((prev: any) => {
        let feedPost = prev.feedPost;
        if (args?.id === feedPost?.id) {
          const _feedPost = updatePostReplies([feedPost], args, user);
          feedPost = { ...feedPost, ..._feedPost[0] };
        }
        const thread = updatePostReplies(feedPost?.thread, args, user);
        const replies = updatePostReplies(feedPost?.replies, args, user);
        const parentChain = updatePostReplies(
          feedPost?.parentChain,
          args,
          user
        );
        return {
          ...prev,
          feedPost: {
            ...feedPost,
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  /**
   * Update deleted post and return posts
   * @param feed FeedPost[]
   * @param args object
   * @returns FeedPost[]
   */
  const updateDeletedPost = (
    feed: FeedPost[],
    args: { id: string; userId: string; deletedAt?: string | Date }
  ): FeedPost[] => {
    return (feed ?? []).map((d) => {
      if (d.id === args.id) {
        return { ...d, deletedAt: args.deletedAt };
      }
      if (d.parent && d.parentId === args.id) {
        return { ...d, parent: { ...d.parent, deletedAt: args.deletedAt } };
      }
      return d;
    });
  };

  /**
   * SWR mutate deleted post
   */
  const mutateDeletedPost = useCallback(
    (args: { id: string; userId: string; deletedAt?: string | Date }) => {
      const update = (feed: FeedPost[]) => updateDeletedPost(feed, args);
      mutateData(update);
      if (!setState) return;
      setState((prev: any) => {
        const feedPost = prev.feedPost;
        const thread = updateDeletedPost(feedPost.thread, args);
        const replies = updateDeletedPost(feedPost.replies, args);
        const parentChain = updateDeletedPost(feedPost.parentChain, args);

        return {
          ...prev,
          feedPost: {
            ...feedPost,
            ...(args.id === feedPost.id && { deletedAt: args.deletedAt }),
            ...(feedPost?.parent &&
              args.id === feedPost?.parentId && {
                parent: {
                  ...feedPost.parent,
                  deletedAt: args.deletedAt,
                },
              }),
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  /**
   * Update post filter and return posts
   * @param feed FeedPost[]
   * @param postId string
   * @returns FeedPost[]
   */
  const updatePostFilter = (feed: FeedPost[], postId: string): FeedPost[] => {
    return feed.filter((d) => d.id !== postId && d.parentId !== postId);
  };

  /**
   * SWR mutate post filter
   */
  const mutatePostFilter = useCallback(
    (postId: string) => {
      const update = (feed: FeedPost[]) => updatePostFilter(feed, postId);
      mutateData(update);
      if (!setState) return;
      setState((prev: any) => {
        const feedPost = prev.feedPost;
        const thread = updatePostFilter(feedPost.thread, postId);
        const replies = updatePostFilter(feedPost.replies, postId);
        const parentChain = updatePostFilter(feedPost.parentChain, postId);

        return {
          ...prev,
          feedPost: {
            ...feedPost,
            ...(postId === feedPost.id && { deletedAt: new Date() }),
            ...(feedPost?.parent &&
              postId === feedPost?.parentId && {
                parent: {
                  ...feedPost.parent,
                  deletedAt: new Date(),
                },
              }),
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  /**
   * Update block and return posts
   * @param feed FeedPost[]
   * @param args object
   * @returns FeedPost[]
   */
  const updateBlockUser = (
    feed: FeedPost[],
    args: { blockedId: string; isBlocked: boolean; isFilter: boolean }
  ): FeedPost[] => {
    if(args.isFilter){
      return feed.filter(
        (d) => d.author.id !== args.blockedId && d?.parent?.author.id !== args.blockedId
      );
    }else{
      return (feed ?? []).map(d => d?.author?.id === args.blockedId ? {...d, actions: {...d?.actions, isBlockedByUser: args.isBlocked}}: d)
    }
  };

  /**
   * SWR mutate mute user
   */
  const mutateBlockUser = useCallback(
    (args: { blockedId: string; isBlocked: boolean; isFilter: boolean }) => {
      console.log("muted args ", args )
      const update = (feed: FeedPost[]) => updateBlockUser(feed, args);
      mutateData(update);
      if (!setState) return;
      setState((prev: any) => {
        const feedPost: FeedPostDetail = prev.feedPost;
        const thread = updateBlockUser(feedPost.thread, args);
        const replies = updateBlockUser(feedPost.replies, args);
        const parentChain = updateBlockUser(feedPost.parentChain, args);

        return {
          ...prev,
          feedPost: {
            ...feedPost,
            ...(args.blockedId === feedPost.userId && { 
              actions: {...feedPost?.actions, isBlockedByUser: args.isBlocked},
              deletedAt: args.isFilter ? new Date() : null
            }),
            ...(feedPost?.parent &&
              args.blockedId === feedPost?.parent?.userId && {
                parent: {
                  ...feedPost.parent,
                  actions: {...feedPost?.parent?.actions, isBlockedByUser: args.isBlocked},
                  deletedAt: args.isFilter ? new Date() : null,
                },
              }),
            
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  /**
   * Update mute user and return posts
   * @param feed FeedPost[]
   * @param args object
   * @returns FeedPost[]
   */
  const updateMuteUser = (
    feed: FeedPost[],
    args: { mutedId: string; isMuted: boolean; isFilter: boolean }
  ): FeedPost[] => {
    if(args.isFilter){
      return feed.filter(
        (d) => d.author.id !== args.mutedId && d?.parent?.author.id !== args.mutedId
      );
    }else{
      return (feed ?? []).map(d => d?.author?.id === args.mutedId ? {...d, actions: {...d?.actions, isMutedByUser: args.isMuted}}: d)
    }
  };

  /**
   * SWR mutate mute user
   */
  const mutateMuteUser = useCallback(
    (args: { mutedId: string; isMuted: boolean; isFilter: boolean }) => {
      console.log("muted args ", args )
      const update = (feed: FeedPost[]) => updateMuteUser(feed, args);
      mutateData(update);
      if (!setState) return;
      setState((prev: any) => {
        const feedPost: FeedPostDetail = prev.feedPost;
        const thread = updateMuteUser(feedPost.thread, args);
        const replies = updateMuteUser(feedPost.replies, args);
        const parentChain = updateMuteUser(feedPost.parentChain, args);

        return {
          ...prev,
          feedPost: {
            ...feedPost,
            ...(args.mutedId === feedPost.userId && { 
              actions: {...feedPost?.actions, isMutedByUser: args.isMuted},
              deletedAt: args.isFilter ? new Date() : null
            }),
            ...(feedPost?.parent &&
              args.mutedId === feedPost?.parent?.userId && {
                parent: {
                  ...feedPost.parent,
                  actions: {...feedPost?.parent?.actions, isMutedByUser: args.isMuted},
                  deletedAt: args.isFilter ? new Date() : null,
                },
              }),
            
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  /**
   * Update post shares and return posts
   * @param feed FeedPost[]
   * @param id string
   * @returns FeedPost[]
   */
  const updatePostShares = (feed: FeedPost[], id: string): FeedPost[] => {
    return (feed ?? []).map((d) => {
      if (d.id === id) {
        return { ...d, totalShares: d.totalShares + 1 };
      }
      if (d.parent && d.parentId === id) {
        return {
          ...d,
          parent: { ...d.parent, totalShares: d.parent.totalShares + 1 },
        };
      }
      return d;
    });
  };

  /**
   * SWR mutate post shares
   */
  const mutatePostShares = useCallback(
    (id: string) => {
      const update = (feed: FeedPost[]) => updatePostShares(feed, id);
      mutateData(update);
      if (!setState) return;
      setState((prev: any) => {
        let feedPost = prev.feedPost;
        if (id === feedPost?.id) {
          const _feedPost = updatePostShares([feedPost], id);
          feedPost = { ...feedPost, ..._feedPost[0] };
        }
        const thread = updatePostShares(feedPost?.thread, id);
        const replies = updatePostShares(feedPost?.replies, id);
        const parentChain = updatePostShares(feedPost?.parentChain, id);

        return {
          ...prev,
          feedPost: {
            ...feedPost,
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  /**
   * Update post impressions and return posts
   * @param feed FeedPost[]
   * @param id string
   * @returns FeedPost[]
   */
  const updatePostImpressions = (feed: FeedPost[], id: string): FeedPost[] => {
    return (feed ?? []).map((d) => {
      if (d.id === id) {
        return { ...d, totalImpressions: d.totalImpressions + 1 };
      }
      if (d.parent && d.parentId === id) {
        return {
          ...d,
          parent: {
            ...d.parent,
            totalImpressions: d.parent.totalImpressions + 1,
          },
        };
      }
      return d;
    });
  };

  /**
   * SWR mutate post impressions
   */
  const mutatePostImpressions = useCallback(
    (id: string) => {
      const update = (feed: FeedPost[]) => updatePostImpressions(feed, id);
      mutateData(update);
      if (!setState) return;
      setState((prev: any) => {
        let feedPost = prev.feedPost;
        if (id === feedPost?.id) {
          const _feedPost = updatePostImpressions([feedPost], id);
          feedPost = { ...feedPost, ..._feedPost[0] };
        }
        const thread = updatePostImpressions(feedPost?.thread, id);
        const replies = updatePostImpressions(feedPost?.replies, id);
        const parentChain = updatePostImpressions(feedPost?.parentChain, id);

        return {
          ...prev,
          feedPost: {
            ...feedPost,
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  /**
   * Update post tips and return posts
   * @param feed FeedPost[]
   * @param id string
   * @returns FeedPost[]
   */
  const updatePostTips = (feed: FeedPost[], id: string): FeedPost[] => {
    return (feed ?? []).map((d) => {
      if (d.id === id) {
        return { ...d, totalTips: d.totalTips + 1 };
      }
      if (d.parent && d.parentId === id) {
        return {
          ...d,
          parent: {
            ...d.parent,
            totalTips: d.parent.totalTips + 1,
          },
        };
      }
      return d;
    });
  };

  /**
   * SWR mutate post tips
   */
  const mutatePostTips = useCallback(
    (id: string) => {
      const update = (feed: FeedPost[]) => updatePostTips(feed, id);
      mutateData(update);
      if (!setState) return;
      setState((prev: any) => {
        let feedPost = prev.feedPost;
        if (id === feedPost?.id) {
          const _feedPost = updatePostTips([feedPost], id);
          feedPost = { ...feedPost, ..._feedPost[0] };
        }
        const thread = updatePostTips(feedPost?.thread, id);
        const replies = updatePostTips(feedPost?.replies, id);
        const parentChain = updatePostTips(feedPost?.parentChain, id);

        return {
          ...prev,
          feedPost: {
            ...feedPost,
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  /**
   * Update post views and return posts
   * @param feed FeedPost[]
   * @param id string
   * @returns FeedPost[]
   */
  const updatePostViews = (feed: FeedPost[], id: string): FeedPost[] => {
    return (feed ?? []).map((d) => {
      if (d.id === id) {
        return { ...d, totalViews: d.totalViews + 1 };
      }
      if (d.parent && d.parentId === id) {
        return {
          ...d,
          parent: { ...d.parent, totalViews: d.parent.totalViews + 1 },
        };
      }
      return d;
    });
  };

  /**
   * SWR mutate post views
   */
  const mutatePostViews = useCallback(
    (id: string) => {
      const update = (feed: FeedPost[]) => updatePostViews(feed, id);
      mutateData(update);
      //   update state if any
      if (!setState) return;
      setState((prev: any) => {
        let feedPost = prev.feedPost;
        if (id === feedPost?.id) {
          const _feedPost = updatePostViews([feedPost], id);
          feedPost = { ...feedPost, ..._feedPost[0] };
        }
        const thread = updatePostViews(feedPost?.thread, id);
        const replies = updatePostViews(feedPost?.replies, id);
        const parentChain = updatePostViews(feedPost?.parentChain, id);

        return {
          ...prev,
          feedPost: {
            ...feedPost,
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  /**
   * Update post author and return posts
   * @param feed FeedPost[]
   * @param userId string
   * @param isFollow boolean
   * @returns FeedPost[]
   */
  const updatePostAuthor = (
    feed: FeedPost[],
    userId: string,
    action: FollowAction
  ): FeedPost[] => {
    return (feed ?? []).map((d) => {
      const conn = getFollowStatus(d.author.conn, d.author.meta, action);
      if (d.userId === userId) {
        return {
          ...d,
          author: {
            ...d.author,
            conn: {
              ...d.author.conn,
              ...conn,
            },
          },
          tagUsers: d.tagUsers.map((u) =>
            u.id === userId ? { ...u, conn: { ...u.conn, ...conn } } : u
          ),
          mentions: d.mentions.map((u) =>
            u.id === userId ? { ...u, conn: { ...u.conn, ...conn } } : u
          ),
        };
      }
      if (d?.parent && d?.parent?.author?.id === userId) {
        const conn = getFollowStatus(
          d?.parent?.author?.conn,
          d?.parent?.author?.meta,
          action
        );
        return {
          ...d,
          parent: {
            ...d.parent,
            author: {
              ...d.parent.author,
              conn: { ...d.parent.author.conn, ...conn },
            },
            tagUsers: d?.parent?.tagUsers.map((u) =>
              u.id === userId ? { ...u, conn: { ...u.conn, ...conn } } : u
            ),
            mentions: d?.parent?.mentions.map((u) =>
              u.id === userId ? { ...u, conn: { ...u.conn, ...conn } } : u
            ),
          },
        };
      }
      return d;
    });
  };

  /**
   * SWR mutate post author
   */
  const mutatePostAuthor = useCallback(
    (userId: string, action: FollowAction) => {
      const update = (feed: FeedPost[]) =>
        updatePostAuthor(feed, userId, action);
      mutateData(update);
      if (!setState) return;
      setState((prev: any) => {
        let feedPost = prev.feedPost;
        if (userId === feedPost?.userId) {
          const _feedPost = updatePostAuthor([feedPost], userId, action);
          feedPost = { ...feedPost, ..._feedPost[0] };
        }
        const thread = updatePostAuthor(feedPost?.thread, userId, action);
        const replies = updatePostAuthor(feedPost?.replies, userId, action);
        const parentChain = updatePostAuthor(
          feedPost?.parentChain,
          userId,
          action
        );

        return {
          ...prev,
          feedPost: {
            ...feedPost,
            thread,
            replies,
            parentChain,
          },
        };
      });
    },
    [mutateData, setState]
  );

  return {
    updatePostLikes,
    mutatePostLikes,

    updatePostBookmarks,
    mutatePostBookmarks,

    updatePostReposts,
    mutatePostReposts,

    updatePostQuotes,
    mutatePostQuotes,

    updatePostReplies,
    mutatePostReplies,

    updateDeletedPost,
    mutateDeletedPost,

    updatePostFilter,
    mutatePostFilter,

    updateBlockUser,
    mutateBlockUser,

    updateMuteUser,
    mutateMuteUser,

    updatePostShares,
    mutatePostShares,

    updatePostImpressions,
    mutatePostImpressions,

    updatePostViews,
    mutatePostViews,

    updatePostAuthor,
    mutatePostAuthor,

    updatePostTips,
    mutatePostTips,

    updatePostPinAndHighlight,
    mutatePostPinAndHighlight,
  };
};

export default useFeedMutations;
