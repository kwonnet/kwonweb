"use client";
import { FeedPost, FeedPostDetail } from "@/types";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import CreateQuoteDrawer from "@/components/post/CreateQuoteDrawer";
import CreateReplyDrawer from "@/components/post/CreateReplyDrawer";
import FeedSocialShare from "@/components/post/FeedSocialShare";
import {
  useAuthSession,
  useFeedCacheUpdater,
  usePostSseListeners,
  useTrackPostView,
} from "@/hooks";
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
import { updateUserFollower } from "@/lib/users";
import { getScopeMessage } from "@/utils/post";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import useSWRInfinite from "swr/infinite";
import { debounce } from "lodash";
// import DisabledVisibleOutlinedIcon from '@mui/icons-material/DisabledVisibleOutlined';
import SpeakerNotesOffOutlinedIcon from "@mui/icons-material/SpeakerNotesOffOutlined";
import Link from "next/link";
import { FollowAction } from "@/types/user";
import StickyWrapper from "@/components/common/StickyWrapper";
import { getSessionId } from "@/utils";
const ReplyBox = ({
  handleReply,
  canReply,
  scopeMessage,
  isDeleted,
  item,
}: {
  handleReply: (ev: any) => void;
  canReply: boolean;
  scopeMessage: string;
  isDeleted: boolean;
  item: FeedPost;
}) => {
  const { user } = useAuthSession();
  if (isDeleted) return null;
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
            border: (theme) =>
              `4px solid ${theme.vars.palette.background.paper}`,
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
        <Stack direction={"row"} spacing={1} alignItems={"center"}>
          <Button
            size="small"
            disabled
            variant="contained"
            sx={{ borderRadius: 30 }}
          >
            Reply
          </Button>
          {item.totalHiddenReplies > 0 && (
            <Tooltip title="Hidden replies">
              <IconButton
                LinkComponent={Link}
                href={`/${item.author.username}/feed/${item.id}/hidden`}
                color="inherit"
              >
                <SpeakerNotesOffOutlinedIcon color="disabled" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
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

  const activePost = parentChain.length > 0 ? ancestoryChain[lastIndex] : post;

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

  const { data, error, isLoading, mutate, setSize } = useSWRInfinite(
    getKey,
    (args) => getPostReplies(args, token),
    {
      keepPreviousData: false,
      fallbackData: [activePost.replies],
    }
  );

  const postReplies = data ? data?.flat() : [];

  const isReachingEnd =
    (data && data[data.length - 1]?.length === 0) || !!error;

  // feed cache update
  const mutations = useFeedCacheUpdater(mutate, setState);
  // listen to sse streams
  usePostSseListeners(user, mutate, setState);
  // track post views
  useTrackPostView(activePost?.id);

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
  // event handlers
  const handleReaction = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
    liked: boolean
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    mutations.mutatePostLikes({ id, liked }, true);
    await postReaction(id, token);
  };

  const handleBookmark = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
    saved: boolean
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    mutations.mutatePostBookmarks({ saved, id }, true);
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
    mutations.mutatePostQuotes({ id, quoted });
  };

  const handleRepost = async (ev: any, postId: string, reposted: boolean) => {
    ev.preventDefault();
    ev.stopPropagation();
    // handle local update
    mutations.mutatePostReposts({ postId, reposted }, true);
    await updateRePost(postId, token);
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

  const onSocialCallback = async (id: string, kind?: string) => {
    mutations.mutatePostShares(id);
    const sessionId = getSessionId();
    const payload = {id, kind, sessionId, timestamp: new Date().toISOString()}
    await shareFeedPost(payload, token);
  };

  const onReplyCallback = (id: string, replied: boolean, reply?: FeedPost) => {
    // updatePostReplies({ id, replied, reply });
  };

  // follow user
  const onFollowUserCallback = (
    args: {
      senderId: string;
      recipientId: string;
      action: FollowAction
    }
  ) => {
    mutations.mutatePostAuthor(args.recipientId, args.action);
    // send to api
    updateUserFollower(args, token);
  };

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
    // eslint-disable-next-line
  }, [activePost?.id]);

  return (
    <StickyWrapper title="Post">
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
      <Box sx={{px: 2}}>
        <ReplyBox
          handleReply={(ev) => handleReply(ev, activePost)}
          scopeMessage={scopeMessage}
          canReply={activePost.actions.canReply}
          isDeleted={!!activePost.deletedAt}
          item={activePost}
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
          // lastIndex={idx === post.thread.length - 1}
        />
      ))}
      {post.thread.length > 0 && (
        <Box sx={{px: 2}}>
          <ReplyBox
            handleReply={(ev) => handleReply(ev, activePost)}
            scopeMessage={scopeMessage}
            canReply={activePost.actions.canReply}
            isDeleted={!!activePost.deletedAt}
            item={activePost}
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
        <Box sx={{px: 2}}>
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
            isDeleted={!!activePost.deletedAt}
            item={activePost}
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
        onSocialClick={onSocialCallback}
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
    </StickyWrapper>
  );
};

export default PageClient;
