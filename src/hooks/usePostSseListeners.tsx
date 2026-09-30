"use client";
import { useEffect } from "react";
import useFeedMutations from "./useFeedCacheUpdater"; // Adjust the path as needed
import { useSSEContext } from "@/context/SSEContext";
import { FeedPost, SwrGenericMutateFunction } from "@/types";
import { User } from "next-auth";
import { FollowResponse } from "@/types/user";
import { usePathname } from "next/navigation";

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
  isProfile?: boolean
) => {
  const { sseSource } = useSSEContext();
  const mutations = useFeedMutations(mutate, setState);

  useEffect(() => {
    if (!sseSource) return;

    const listeners: { event: string; handler: (ev: MessageEvent) => void }[] =
      [
        {
          event: "post_reaction",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (arg.userId !== user.id) {
              mutations.mutatePostLikes(
                { id: arg.id!, liked: arg.liked! },
                false
              );
            }
          },
        },
        {
          event: "post_bookmark",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (arg.userId !== user.id) {
              mutations.mutatePostBookmarks(
                { id: arg.id!, saved: arg.saved! },
                false
              );
            }
          },
        },
        {
          event: "post_share",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (arg.userId !== user.id) {
              mutations.mutatePostShares(arg.id!);
            }
          },
        },
        {
          event: "post_repost",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (!arg.reposted || arg.userId !== user.id) {
              mutations.mutatePostReposts(
                {
                  childId: arg.id,
                  postId: arg.postId!,
                  reposted: arg.reposted!,
                },
                false
              );
            }
          },
        },
        {
          event: "post_quote",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (arg.userId !== user.id) {
              mutations.mutatePostQuotes({ id: arg.id!, quoted: arg.quoted! });
            }
          },
        },
        {
          event: "post_reply",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            // if (arg.userId !== user.id) {
            mutations.mutatePostReplies(arg, user);
            // }
          },
        },
        {
          event: "user_follower",
          handler: (ev: MessageEvent) => {
            const arg: FollowResponse = JSON.parse(ev.data);
            if (arg.senderId === user.id) {
              mutations.mutatePostAuthor(arg.recipientId, arg.action);
            }
          },
        },
        {
          event: `post_not_interested_${user.id}`,
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (arg.userId === user.id && !arg.interested) {
              mutations.mutatePostFilter(arg.id!);
            }
          },
        },
        {
          event: `post_report_${user.id}`,
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (arg.userId === user.id && !arg.interested) {
              mutations.mutatePostFilter(arg.id!);
            }
          },
        },
        {
          event: `user_blocked_${user.id}`,
          handler: (ev: MessageEvent) => {
            const args:  {
              isBlocked: boolean;
              id: string;
              createdAt: Date;
              updatedAt: Date;
              blockedId: string;
              blockerId: string;
            } = JSON.parse(ev.data);
            if (args.blockerId === user.id) {
              mutations.mutateBlockUser({
                blockedId: args.blockedId!,
                isBlocked: args.isBlocked,
                isFilter: isProfile ? false : args.isBlocked,
              });
            }
          },
        },
        {
          event: `user_muted_${user.id}`,
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
            if (args.muterId === user.id) {
              mutations.mutateMuteUser({
                mutedId: args.mutedId,
                isMuted: args.isMuted,
                isFilter: isProfile ? false : args.isMuted,
              });
            }
          },
        },

        {
          event: `post_pin_${user.id}`,
          handler: (ev: MessageEvent) => {
            const args: { id: string; userId: string; isPinned: boolean } =
              JSON.parse(ev.data);
            if (args.userId === user.id) {
              mutations.mutatePostPinAndHighlight({
                id: args.id,
                hasPinned: args.isPinned,
              });
            }
          },
        },
        {
          event: `post_highlight_${user.id}`,
          handler: (ev: MessageEvent) => {
            const args: { id: string; userId: string; isHighlighted: boolean } =
              JSON.parse(ev.data);
            if (args.userId === user.id) {
              mutations.mutatePostPinAndHighlight({
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
            if (arg.userId === user.id) {
              mutations.mutatePostFilter(arg.id!);
            } else {
              mutations.mutateDeletedPost({
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
            if (arg.userId === user.id) {
              mutations.mutatePostFilter(arg.id!);
            } else {
              mutations.mutateDeletedPost({
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
            mutations.mutatePostImpressions(arg.id!);
          },
        },

        {
          event: "post_tip",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            mutations.mutatePostTips(arg.id!);
          },
        },
        {
          event: "post_view",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            mutations.mutatePostViews(arg.id!);
          },
        },
        {
          event: "post_hidden",
          handler: (ev: MessageEvent) => {
            const arg: SseEventArgs = JSON.parse(ev.data);
            if (arg.userId === user.id) {
              mutations.mutatePostFilter(arg.id!);
            }
          },
        },
      ];

    listeners.forEach(({ event, handler }) => {
      sseSource.addEventListener(event, handler);
    });

    return () => {
      listeners.forEach(({ event, handler }) => {
        sseSource.removeEventListener(event, handler);
      });
    };
  }, [sseSource, user, mutations, mutate, isProfile]);
};

export default usePostSseListeners;
