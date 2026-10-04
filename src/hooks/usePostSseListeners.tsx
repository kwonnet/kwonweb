"use client";
import { useEffect, useRef } from "react";
import useFeedMutations from "./useFeedCacheUpdater"; // Adjust the path as needed
import { useSSEContext } from "@/context/SSEContext";
import { FeedPost, SwrGenericMutateFunction } from "@/types";
import { User } from "next-auth";
import { FollowResponse } from "@/types/user";
import { isReactionPending } from "@/utils/post-reactions";

interface SseEventArgs {
  userId?: string;
  id: string;
  liked?: boolean;
  saved?: boolean;
  reposted?: boolean;
  childId?: string;
  postId?: string;
  quoted?: boolean;
  replied?: boolean;
  senderId?: string;
  recipient?: string;
  isFollow?: boolean;
  interested?: boolean;
  blockerId?: string;
  blockedId?: string;
  isBlocked?: boolean;
  muterId?: string;
  mutedId?: string;
  isMuted?: boolean;
  deletedAt?: string | Date;
  reply?: FeedPost;
}

const usePostSseListeners = (
  user: User,
  mutate: SwrGenericMutateFunction<FeedPost>,
  setState?: (value: React.SetStateAction<any>) => void,
  isProfile?: boolean,
  onRevalidate?: () => void,
  visiblePosts?: FeedPost[][]
) => {
  const { sseSource } = useSSEContext();
  const mutations = useFeedMutations(mutate, setState);

  const latest = useRef({ mutations, mutate, onRevalidate, visiblePosts, user });
  latest.current = { mutations, mutate, onRevalidate, visiblePosts, user };

  const userId = user.id;
  useEffect(() => {
    if (!sseSource) return;

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        // Fetch authoritative counts instead of adding replayable SSE deltas.
        void latest.current.mutate();
        latest.current.onRevalidate?.();
      }, 150);
    };
    const refreshFor = (id?: string) => {
      const includes = (post: FeedPost): boolean => post.id === id || (!!post.parent && includes(post.parent));
      if (id && latest.current.visiblePosts?.flat().some(includes)) refresh();
    };
    let opened = sseSource.readyState === EventSource.OPEN;
    const onOpen = () => { if (opened) refresh(); opened = true; };
    sseSource.addEventListener("open", onOpen);

    const listeners: { event: string; handler: (ev: MessageEvent) => void }[] =
      [
        {
          event: "post_reaction",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (isReactionPending(`${userId}:like:${arg.id}`) && arg.userId === userId) return;
            if (arg.userId === userId && typeof arg.liked === "boolean") {
              latest.current.mutations.mutatePostLikes({ id: arg.id, liked: arg.liked });
            } else refreshFor(arg.id);
          },
        },
        {
          event: "post_bookmark",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (isReactionPending(`${userId}:bookmark:${arg.id}`) && arg.userId === userId) return;
            if (arg.userId === userId && typeof arg.saved === "boolean") {
              latest.current.mutations.mutatePostBookmarks({ id: arg.id, saved: arg.saved });
            } else refreshFor(arg.id);
          },
        },
        { event: "post_share", handler: (ev: MessageEvent) => refreshFor(JSON.parse(ev.data).id) },
        {
          event: "post_repost",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (isReactionPending(`${userId}:repost:${arg.postId}`) && arg.userId === userId) return;
            if (arg.userId === userId && arg.postId && typeof arg.reposted === "boolean") {
              latest.current.mutations.mutatePostReposts({ postId: arg.postId, childId: arg.childId, reposted: arg.reposted });
            } else refreshFor(arg.postId);
          },
        },
        { event: "post_quote", handler: (ev: MessageEvent) => refreshFor(JSON.parse(ev.data).id) },
        { event: "post_reply", handler: (ev: MessageEvent) => refreshFor(JSON.parse(ev.data).id) },
        {
          event: "user_follower",
          handler: (ev: MessageEvent) => {
            const arg: FollowResponse = JSON.parse(ev.data);
            if (arg.senderId === userId) {
              latest.current.mutations.mutatePostAuthor(arg.recipientId, arg.action);
            }
          },
        },
        {
          event: `post_not_interested_${userId}`,
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (arg.userId === userId && !arg.interested) {
              latest.current.mutations.mutatePostFilter(arg.id!);
            }
          },
        },
        {
          event: `post_report_${userId}`,
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (arg.userId === userId && !arg.interested) {
              latest.current.mutations.mutatePostFilter(arg.id!);
            }
          },
        },
        {
          event: `user_blocked_${userId}`,
          handler: (ev: MessageEvent) => {
            const args:  {
              isBlocked: boolean;
              id: string;
              createdAt: Date;
              updatedAt: Date;
              blockedId: string;
              blockerId: string;
            } = JSON.parse(ev.data);
            if (args.blockerId === userId) {
              latest.current.mutations.mutateBlockUser({
                blockedId: args.blockedId!,
                isBlocked: args.isBlocked,
                isFilter: isProfile ? false : args.isBlocked,
              });
            }
          },
        },
        {
          event: `user_muted_${userId}`,
          handler: (ev: MessageEvent) => {
            const args: {
              isMuted: boolean;
              id: string;
              createdAt: Date;
              updatedAt: Date;
              mutedId: string;
              muterId: string;
            } = JSON.parse(ev.data);
            console.log("user_muted_event ", args)
            if (args.muterId === userId) {
              latest.current.mutations.mutateMuteUser({
                mutedId: args.mutedId,
                isMuted: args.isMuted,
                isFilter: isProfile ? false : args.isMuted,
              });
            }
          },
        },

        {
          event: `post_pin_${userId}`,
          handler: (ev: MessageEvent) => {
            const args: { id: string; userId: string; isPinned: boolean } =
              JSON.parse(ev.data);
            if (args.userId === userId) {
              latest.current.mutations.mutatePostPinAndHighlight({
                id: args.id,
                hasPinned: args.isPinned,
              });
            }
          },
        },
        {
          event: `post_highlight_${userId}`,
          handler: (ev: MessageEvent) => {
            const args: { id: string; userId: string; isHighlighted: boolean } =
              JSON.parse(ev.data);
            if (args.userId === userId) {
              latest.current.mutations.mutatePostPinAndHighlight({
                id: args.id,
                hasHighlighted: args.isHighlighted,
              });
            }
          },
        },
        {
          event: "post_delete",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (arg.userId === userId) {
              latest.current.mutations.mutatePostFilter(arg.id!);
            } else {
              latest.current.mutations.mutateDeletedPost({
                id: arg.id!,
                userId: arg.userId!,
                deletedAt: arg.deletedAt,
              });
            }
          },
        },
        {
          event: "post_restore",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (arg.userId === userId) {
              latest.current.mutations.mutatePostFilter(arg.id!);
            } else {
              latest.current.mutations.mutateDeletedPost({
                id: arg.id!,
                userId: arg.userId!,
                deletedAt: arg.deletedAt,
              });
            }
          },
        },
        {
          event: "post_impression",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            latest.current.mutations.mutatePostImpressions(arg.id!);
          },
        },

        {
          event: "post_tip",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            latest.current.mutations.mutatePostTips(arg.id!);
          },
        },
        {
          event: "post_view",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            latest.current.mutations.mutatePostViews(arg.id!);
          },
        },
        {
          event: "post_hidden",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (arg.userId === userId) {
              latest.current.mutations.mutatePostFilter(arg.id!);
            }
          },
        },
      ];

    listeners.forEach(({ event, handler }) => {
      sseSource.addEventListener(event, handler);
    });

    return () => {
      clearTimeout(refreshTimer);
      sseSource.removeEventListener("open", onOpen);
      listeners.forEach(({ event, handler }) => {
        sseSource.removeEventListener(event, handler);
      });
    };
  }, [sseSource, userId, isProfile]);
};

export default usePostSseListeners;
