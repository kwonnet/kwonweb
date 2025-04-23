"use client";
import { FeedPost, FeedPostDetail } from "@/types";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import {
  CreateQuoteDrawer,
  CreateReplyDrawer,
  FeedSocialShare,
} from "@/components/post";
import { useAuthSession } from "@/hooks";
import {
  bookmarkPost,
  getPostReplies,
  postReaction,
  shareFeedPost,
  updateRePost,
} from "@/lib/posts";
import FeedCardItem from "./FeedCardItem";
import ThreadCardItem from "./ThreadCardItem";
import { siteUrl } from "@/config";
import { useSSEContext } from "@/context/SSEContext";
import { updateUserFollower } from "@/lib/users";
import FeedAppBar from "./FeedAppBar";
import { useRouter } from "next/navigation";
import { getScopeMessage } from "@/utils/post";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import useSWR, { useSWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";
import { debounce } from "lodash";

const ReplyBox = ({
  handleReply,
  canReply,
  scopeMessage,
}: {
  handleReply: (ev: any) => void;
  canReply: boolean;
  scopeMessage: string;
}) => {
  const { user } = useAuthSession();
  if (!canReply)
    return (
      <Box
        sx={[
          (theme) => ({
            border: `1px solid ${theme.vars.palette.divider}`,
            boxShadow: theme.shadows[2],
            p: 2,
            my: 1,
          }),
        ]}
      >
        <Typography>
          <IconButton color="info">
            <AlternateEmailOutlinedIcon />
          </IconButton>
          {scopeMessage}
        </Typography>
      </Box>
    );
  return (
    <Box sx={{ my: 1 }}>
      <Stack
        spacing={1}
        direction={"row"}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Avatar
          sx={{
            height: 50,
            width: 50,
            border: (theme) => `4px solid ${theme.palette.background.paper}`,
          }}
          alt={user?.name}
          src={user?.image}
          // onClick={(ev) => redirectToProfile(ev, item.user)}
        />
        <TextField
          onClick={(ev) => handleReply(ev)}
          multiline
          variant="standard"
          placeholder="Reply to post"
        />
        <Button
          size="small"
          disabled
          variant="contained"
          sx={{ borderRadius: 30 }}
        >
          Reply
        </Button>
      </Stack>
    </Box>
  );
};

type LocalState = {
  open: boolean;
  openQuote: boolean;
  hasReposted: boolean;
  isOpen: boolean;
  isReplyOpen: boolean;
  url: string;
  postId: string;
  post?: FeedPost;
  feedPost: FeedPostDetail;
};
const PAGE_SIZE = 20;

const PageClient = ({ post: feedPost }: { post: FeedPostDetail }) => {
  const { token, user } = useAuthSession();

  const { sseSource } = useSSEContext();

  const [state, setState] = useState<LocalState>({
    open: false,
    openQuote: false,
    hasReposted: false,
    isOpen: false,
    isReplyOpen: false,
    url: "",
    postId: "",
    feedPost,
  });

  const post = useMemo(() => state.feedPost, [state.feedPost]);

  const parentChain = post.parentChain;

  const ancestoryChain = [...parentChain, { ...post, parentChain: [] }];

  const lastIndex = ancestoryChain.length - 1;

  const activePost =
    parentChain.length > 0 ? ancestoryChain[ancestoryChain.length - 1] : post;

  const scopeMessage = getScopeMessage(
    parentChain.length > 0 ? parentChain[0] : post
  );

  const getKey = (pageIndex: number, previousPageData?: FeedPost[]) => {
    if (pageIndex !== 0 && previousPageData && !previousPageData.length)
      return null; // Stop when no more data
    return {
      type: "post_replies",
      id: activePost.id,
      userId: user.id,
      limit: PAGE_SIZE,
      page: pageIndex + 1,
    };
  };

  const { data, error, isLoading, isValidating, size, mutate, setSize } =
    useSWRInfinite(getKey, (args) => getPostReplies(args, token), {
      keepPreviousData: false,
      fallbackData: [activePost.replies],
    });

  const postReplies = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length === 0) || !!error;

  const debouncedLoadMore = debounce(() => {
    setSize((num) => num + 1);
  }, 700);

  const toggleDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, isOpen: open }));
  };
  const toggleReplyDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, isReplyOpen: open }));
  };

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
    // update comments likes
    mutate((_data) => _data?.map((_d) => updateData(_d)), {
      revalidate: false,
      populateCache: true,
      rollbackOnError: true
    });
    setState((prev) => {
      let feedPost = prev.feedPost;
      if (args?.id === feedPost?.id) {
        feedPost = {
          ...feedPost,
          ...(local && {
            actions: { ...feedPost.actions, hasLiked: args.liked },
          }),
          totalLikes: !args.liked
            ? feedPost?.totalLikes - 1
            : feedPost?.totalLikes + 1,
        };
      }
      const thread = updateData(feedPost?.thread) 
      const replies = updateData(feedPost?.replies) 
      return {
        ...prev,
        feedPost: {
          ...feedPost,
          thread,
          replies,
        },
      };
    });
  };

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
    // update comment bookmarks
    mutate((_data) => _data?.map((_d) => updateData(_d)), {
      revalidate: false,
      populateCache: true,
      rollbackOnError: true
    });

    setState((prev) => {
      let feedPost = prev.feedPost;
      if (args.id === feedPost?.id) {
        feedPost = {
          ...feedPost,
          ...(local && {
            actions: { ...feedPost.actions, hasSaved: args.saved },
          }),
          totalBookmarks: !args.saved
            ? feedPost?.totalBookmarks - 1
            : feedPost?.totalBookmarks + 1,
        };
      }
      const thread = updateData(feedPost?.thread) 
      const replies = updateData(prev?.feedPost?.replies) 
      return {
        ...prev,
        feedPost: {
          ...feedPost,
          thread,
          replies,
        },
      };
    });
  };

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
    // update comment quotes
    mutate((_data) => _data?.map((_d) => updateData(_d)), {
      revalidate: false,
      populateCache: true,
      rollbackOnError: true
    });
    // update state
    setState((prev) => {
      let feedPost = prev.feedPost;
      if (args.id === feedPost?.id) {
        feedPost = {
          ...feedPost,
          totalQuotes: !args.quoted
            ? feedPost?.totalQuotes - 1
            : feedPost?.totalQuotes + 1,
        };
      }
      const thread = updateData(feedPost?.thread)
      
      const replies = updateData(prev?.feedPost?.replies)
      
      return {
        ...prev,
        feedPost: {
          ...feedPost,
          thread,
          replies,
        },
      };
    });
  };

  const updatePostReposts = async (
    args: { id?: string; postId: string; reposted: boolean },
    local: boolean = true
  ) => {
    // id is the post  repost and can be undefined when a user first reposts
    // postId is the ID of the reposted post
    //
    // check if it's global or local update
    // if local update, update if the user has liked or unliked but if global ignore

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
    // update comment reposts
    mutate((_data) => _data?.map((_d) => updateData(_d)), {
      revalidate: false,
      populateCache: true,
      rollbackOnError: true
    });
    const calc = (val: number) => {
      return val < 1 ? 0 : val;
    };
    setState((prev) => {
      let feedPost = prev.feedPost;
      if (args.postId === feedPost?.id) {
        feedPost = {
          ...feedPost,
          ...(local && {
            actions: { ...feedPost.actions, hasReposted: args.reposted },
          }),
          totalReposts: !args.reposted
            ? calc(feedPost?.totalReposts - 1)
            : feedPost?.totalReposts + 1,
        };
      }
      let thread = updateData(feedPost?.thread)
      
      let replies = updateData(prev?.feedPost?.replies)
      
      // if a user undo the repost, filter out the post
      if (args.id && !args.reposted) {
        thread = thread.filter((p) => p.id !== args.id);
        replies = replies.filter((p) => p.id !== args.id);
      }
      return {
        ...prev,
        feedPost: {
          ...feedPost,
          thread,
          replies,
        },
      };
    });
  };

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
    console.log(args)
    const reply = args.reply
    const updateOptimistic = (_data?: FeedPost[][]) =>{
      console.log("this is reply ", args.reply)
      if(_data){
        const updated = _data?.map((_d) => updateData(_d))
        // insert if it's the current active post
        if(reply && activePost.id === args.id && args.userId === user.id){
          console.log("reply exists ", reply)
         updated[0].unshift(reply)
        }
        return updated
      }
      if(!_data && reply) [[reply]]
      return []
    }
    // update comment reposts
    mutate((_data) => updateOptimistic(_data), 
    { 
      optimisticData: (_data) => updateOptimistic(_data),
      revalidate: false,
      populateCache: true,
      rollbackOnError: true,
    });
    setState((prev) => {
      let feedPost = prev.feedPost;
      if (args.id === feedPost?.id) {
        feedPost = {
          ...feedPost,
          totalReplies: !args.replied
            ? feedPost?.totalReplies - 1
            : feedPost?.totalReplies + 1,
        };
      }
      const thread = updateData(feedPost?.thread)
      
      const replies = updateData(prev?.feedPost?.replies)
      
      return {
        ...prev,
        feedPost: {
          ...feedPost,
          thread,
          replies,
        },
      };
    });
  };

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
    // update comment shares
    mutate((_data) => _data?.map((_d) => updateData(_d)), {
      revalidate: false,
      populateCache: true,
      rollbackOnError: true
    });
    setState((prev) => {
      let totalShares = prev.feedPost.totalShares;
      if (id === prev?.feedPost?.id) {
        totalShares = totalShares + 1;
      }
      const thread = updateData(prev?.feedPost?.thread)
      
      const replies = updateData(prev?.feedPost?.replies)
      
      return {
        ...prev,
        feedPost: {
          ...prev.feedPost,
          totalShares,
          thread,
          replies,
        },
      };
    });
    await shareFeedPost(id, token);
  }, 500)

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
    // update comment author
    mutate((_data) => _data?.map((_d) => updateData(_d)), {
      revalidate: false,
      populateCache: true,
      rollbackOnError: true
    });
    setState((prev) => {
      let feedPost = prev.feedPost;
      if (userId === feedPost?.userId) {
        feedPost = {
          ...feedPost,
          author: {
            ...feedPost.author,
            conn: { ...feedPost.author.conn, isFollowed: isFollow },
          },
        };
      }
      const thread = updateData(feedPost?.thread)
      
      const replies = updateData(prev?.feedPost?.replies)
      
      return {
        ...prev,
        feedPost: {
          ...feedPost,
          thread,
          replies,
        },
      };
    });
  };

  const handleReaction = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
    liked: boolean
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    updatePostLikes({ id, liked }, true);
    await postReaction(id, token);
  };

  const handleBookmark = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
    saved: boolean
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    updatePostBookmarks({ saved, id }, true);
    await bookmarkPost(id, token);
  };

  const toggleShareDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    ev.stopPropagation();
    setState((prev) => ({ ...prev, open }));
  };

  const handleShare = (ev: any, item: FeedPost) => {
    ev.preventDefault();
    ev.stopPropagation();
    setState((prev) => ({
      ...prev,
      url: `${siteUrl}/${item.author.username}/feed/${item.id}`,
      postId: item.id,
    }));
    toggleShareDrawer(ev, true);
  };

  const onQuoteClick = async (id: string) => {
    setState((prev) => {
      if (id === prev?.feedPost?.id) {
        return { ...prev, post: prev?.feedPost, isOpen: true };
      }
      const threadPostItem = prev?.feedPost?.thread?.find((d) => d.id === id);
      if (threadPostItem) {
        return { ...prev, post: threadPostItem, isOpen: true };
      }
      const replyPostItem = prev?.feedPost?.replies?.find((d) => d.id === id);
      return { ...prev, post: replyPostItem, isOpen: true };
    });
  };

  const onQuoteCallback = (id: string, quoted: boolean) => {
    updatePostQuotes({ id, quoted });
  };

  const handleRepost = async (ev: any, id: string, reposted: boolean) => {
    ev.preventDefault();
    ev.stopPropagation();
    // handle local update
    updatePostReposts({ postId: id, reposted });
    await updateRePost(id, token);
  };

  const handleReply = (ev: any, item: FeedPost) => {
    ev.preventDefault();
    ev.stopPropagation();
    setState((prev) => ({
      ...prev,
      postId: item.id,
      post: item,
    }));
    toggleReplyDrawer(ev, true);
  };

  const onReplyCallback = (id: string, replied: boolean, reply?: FeedPost) => {
    // updatePostReplies({ id, replied, reply });
  };

  // follow user
  const onFollowUserCallback = (
    args: {
      senderId: string;
      recipientId: string;
    },
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
    const likeListener = debounce((ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      if (arg.userId !== user.id) {
        // handle stream update
        updatePostLikes(arg, false);
      }
    },500)
    sseSource?.addEventListener("post_reaction", likeListener);
    // SSE stream to update post bookmarks
    const bookmarkListener = debounce((ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      if (arg.userId !== user.id) {
        // handle stream update
        updatePostBookmarks(arg, false);
      }
    },500)
    sseSource?.addEventListener("post_bookmark", bookmarkListener);
    // SSE stream to update post bookmarks
    const shareListener = debounce((ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      if (arg.userId !== user.id) {
        // handle stream update
        updatePostShares(arg.id);
      }
    },500)
    sseSource?.addEventListener("post_share", shareListener);
    // SSE stream to update post reposts
    const repostListener = debounce((ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      if (!arg.reposted || arg.userId !== user.id) {
        // handle stream update
        updatePostReposts(arg, false);
      }
    },500)
    sseSource?.addEventListener("post_repost", repostListener);
    // SSE stream to update post quotes
    const quoteListener = debounce((ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      if (arg.userId !== user.id) {
        // handle stream update
        updatePostQuotes(arg);
      }
    },500)
    sseSource?.addEventListener("post_quote", quoteListener);
    // SSE stream to update post replies
    const replyListener = debounce((ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      // if (arg.userId !== user.id) {
        // handle stream update
        updatePostReplies(arg);
      // }
    },500)
    sseSource?.addEventListener("post_reply", replyListener);
    // SSE stream to update user follower
    const followerListener = debounce((ev: MessageEvent) => {
      console.log("SSE stream received ", ev);
      const arg: any = JSON.parse(ev.data);
      console.log("data ", arg, user.id);
      if (arg.senderId === user.id) {
        // handle stream update
        updatePostAuthor(arg.recipient, arg.isFollow);
      }
    },500)
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

  useEffect(() => {
    if (!activePost?.id) return;

    const element = document.getElementById(activePost.id);

    const timer = setTimeout(() => {
      if (element && parentChain.length > 0) {
        element.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }, 0); // Small delay to ensure rendering

    return () => {
      clearTimeout(timer);
    };
  }, [activePost?.id]);

  return (
    <Box
      sx={{
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
      }}
    >
      <FeedAppBar item={activePost} />
      {parentChain.length > 0 ? (
        <Box>
          {ancestoryChain.map((postItem, idx) =>
            lastIndex === idx ? (
              <FeedCardItem
                key={postItem.id}
                post={postItem}
                handleReply={handleReply}
                handleBookmark={handleBookmark}
                handleReaction={handleReaction}
                handleRepost={handleRepost}
                handleShare={handleShare}
                onQuote={onQuoteClick}
                onFollowUserCallback={onFollowUserCallback}
                isRadius={false}
                scopeMessage={scopeMessage}
              />
            ) : (
              <ThreadCardItem
                key={postItem.id}
                post={postItem}
                handleReply={handleReply}
                handleBookmark={handleBookmark}
                handleReaction={handleReaction}
                handleRepost={handleRepost}
                handleShare={handleShare}
                onQuote={onQuoteClick}
                onFollowUserCallback={onFollowUserCallback}
                lastIndex={false}
                isDivider={true}
                scopeMessage={scopeMessage}
              />
            )
          )}
        </Box>
      ) : (
        <FeedCardItem
          key={post.id}
          post={post}
          handleReply={handleReply}
          handleBookmark={handleBookmark}
          handleReaction={handleReaction}
          handleRepost={handleRepost}
          handleShare={handleShare}
          onQuote={onQuoteClick}
          onFollowUserCallback={onFollowUserCallback}
          scopeMessage={scopeMessage}
        />
      )}
      {/* comment form */}
      <Box>
        <ReplyBox
          handleReply={(ev) => handleReply(ev, activePost)}
          scopeMessage={scopeMessage}
          canReply={activePost.actions.canReply}
        />
      </Box>
      {/* display thread */}
      {post.thread.map((item, idx) => (
        <ThreadCardItem
          key={idx}
          post={item}
          handleReply={handleReply}
          handleBookmark={handleBookmark}
          handleReaction={handleReaction}
          handleRepost={handleRepost}
          handleShare={handleShare}
          onQuote={onQuoteClick}
          onFollowUserCallback={onFollowUserCallback}
          isDivider={true}
          scopeMessage={scopeMessage}
        />
      ))}
      {post.thread.length > 0 && (
        <Box>
          <ReplyBox
            handleReply={(ev) => handleReply(ev, activePost)}
            scopeMessage={scopeMessage}
            canReply={activePost.actions.canReply}
          />
        </Box>
      )}
      {/* display replies */}
      {postReplies.map((item, idx) => (
        <ThreadCardItem
          key={idx}
          post={item}
          handleBookmark={handleBookmark}
          handleReaction={handleReaction}
          handleRepost={handleRepost}
          handleShare={handleShare}
          handleReply={handleReply}
          onQuote={onQuoteClick}
          onFollowUserCallback={onFollowUserCallback}
          scopeMessage={scopeMessage}
        />
      ))}

      {postReplies.length > 0 && (
        <Box>
          {postReplies.length < activePost.totalReplies && (
            <Box sx={{ my: 1, textAlign: "center" }}>
              <Button
                size="small"
                disabled={isReachingEnd}
                loading={isLoading}
                onClick={(ev) => {
                  ev.preventDefault();
                  debouncedLoadMore();
                }}
                sx={{ borderRadius: 30 }}
                variant="outlined"
              >
                Show more replies
              </Button>
            </Box>
          )}

          <ReplyBox
            handleReply={(ev) => handleReply(ev, activePost)}
            scopeMessage={scopeMessage}
            canReply={activePost.actions.canReply}
          />
        </Box>
      )}

      {/*  */}
      {/* share post */}
      <FeedSocialShare
        isOpen={state.open}
        url={state.url}
        postId={state.postId}
        toggleDrawer={toggleShareDrawer}
        onSocialClick={updatePostShares}
      />
      {/* reply drawer */}
      <CreateReplyDrawer
        isOpen={state.isReplyOpen}
        toggleDrawer={toggleReplyDrawer}
        post={state.post}
        onReplyCallback={onReplyCallback}
        onFollowUserCallback={onFollowUserCallback}
      />
      {/* create quote drawer */}
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
