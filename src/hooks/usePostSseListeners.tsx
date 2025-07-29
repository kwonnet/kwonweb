import { useEffect } from "react";
import useFeedMutations from "./useFeedCacheUpdater"; // Adjust the path as needed
import { useSSEContext } from "@/context/SSEContext";
import { FeedPost, SwrGenericMutateFunction } from "@/types";
import { User } from "next-auth";

interface SseEventArgs {
  userId?: string;
  id: string;
  liked?: boolean;
  saved?: boolean;
  reposted?: boolean;
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
  setState?: (value: React.SetStateAction<any>) => void
) => {
  const { sseSource } = useSSEContext();
  const mutations = useFeedMutations(mutate, setState);

  useEffect(() => {
    if (!sseSource) return;

    console.log("sseSource ", sseSource);

    const listeners: { event: string; handler: (ev: MessageEvent) => void }[] =
      [
        {
          event: "post_reaction",
          handler: (ev: MessageEvent) => {
            console.log("SSE post_reaction stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
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
            console.log("SSE post_bookmark stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
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
            console.log("SSE post_share stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
            if (arg.userId !== user.id) {
              mutations.mutatePostShares(arg.id!);
            }
          },
        },
        {
          event: "post_repost",
          handler: (ev: MessageEvent) => {
            console.log("SSE post_repost stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
            if (!arg.reposted || arg.userId !== user.id) {
              mutations.mutatePostReposts(
                { id: arg.id, postId: arg.postId!, reposted: arg.reposted! },
                false
              );
            }
          },
        },
        {
          event: "post_quote",
          handler: (ev: MessageEvent) => {
            console.log("SSE post_quote stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
            if (arg.userId !== user.id) {
              mutations.mutatePostQuotes({ id: arg.id!, quoted: arg.quoted! });
            }
          },
        },
        {
          event: "post_reply",
          handler: (ev: MessageEvent) => {
            console.log("SSE post_reply stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
            // if (arg.userId !== user.id) {
              mutations.mutatePostReplies(arg, user);
            // }
          },
        },
        {
          event: "user_follower",
          handler: (ev: MessageEvent) => {
            console.log("SSE user_follower stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
            if (arg.senderId === user.id) {
              mutations.mutatePostAuthor(arg.recipient!, arg.isFollow!);
            }
          },
        },
        {
          event: `post_not_interested_${user.id}`,
          handler: (ev: MessageEvent) => {
            console.log("SSE post_not_interested_ stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
            if (arg.userId === user.id && !arg.interested) {
              mutations.mutatePostFilter(arg.id!);
            }
          },
        },
        {
          event: `post_report_${user.id}`,
          handler: (ev: MessageEvent) => {
            console.log("SSE post_report_ stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
            if (arg.userId === user.id && !arg.interested) {
              mutations.mutatePostFilter(arg.id!);
            }
          },
        },
        {
          event: `user_blocked_${user.id}`,
          handler: (ev: MessageEvent) => {
            console.log("SSE user_blocked_ stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
            if (arg.blockerId === user.id && arg.isBlocked) {
              mutations.mutateBlockOrMuteUser(arg.blockedId!);
            }
          },
        },
        {
          event: `user_muted_${user.id}`,
          handler: (ev: MessageEvent) => {
            console.log("SSE user_muted_ stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
            if (arg.muterId === user.id && arg.isMuted) {
              mutations.mutateBlockOrMuteUser(arg.mutedId!);
            }
          },
        },
        {
          event: "post_delete",
          handler: (ev: MessageEvent) => {
            console.log("SSE post_delete stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
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
            console.log("SSE post_restore stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
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
            console.log("SSE post_impression stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
            mutations.mutatePostImpressions(arg.id!);
          },
        },

        {
          event: "post_tip",
          handler: (ev: MessageEvent) => {
            console.log("SSE post_tip stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
            mutations.mutatePostTips(arg.id!);
          },
        },
        {
          event: "post_view",
          handler: (ev: MessageEvent) => {
            console.log("SSE post_view stream received ", ev);
            const arg: SseEventArgs = JSON.parse(ev.data);
            console.log("data ", arg, user.id);
            mutations.mutatePostViews(arg.id!);
          },
        },
        {
          event: "post_hidden",
          handler: (ev: MessageEvent) => {
            console.log("SSE post_hidden stream received ", ev);
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
  }, [sseSource, user, mutations, mutate]);
};

export default usePostSseListeners;
