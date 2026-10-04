"use client";
import { useCallback } from "react";
import { useSWRConfig } from "swr";
import { useNotifications } from "@/providers/NotificationsProvider";
import { postReaction, bookmarkPost, updateRePost } from "@/lib/posts";
import { runReaction, updateReaction, type ReactionKind } from "@/utils/post-reactions";

type Mutations = {
  mutatePostLikes: (args: { id: string; liked: boolean }) => void;
  mutatePostBookmarks: (args: { id: string; saved: boolean }) => void;
  mutatePostReposts: (args: { postId: string; reposted: boolean }) => void;
};
export default function usePostInteractions(userId: string, token: string | undefined, mutations: Mutations, revalidate: () => unknown) {
  const notifications = useNotifications();
  const { mutatePostLikes, mutatePostBookmarks, mutatePostReposts } = mutations;
  const { cache, mutate } = useSWRConfig();
  const perform = useCallback(async (ev: any, id: string, selected: boolean, kind: ReactionKind) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!token || !userId) { notifications.show("Please sign in to react to posts.", { severity: "error", autoHideDuration: 5000 }); return; }
    const apply = (value: boolean) => {
      if (kind === "like") mutatePostLikes({ id, liked: value });
      if (kind === "bookmark") mutatePostBookmarks({ id, saved: value });
      if (kind === "repost") mutatePostReposts({ postId: id, reposted: value });
      // Update other cached feed pages too, including views currently unmounted.
      for (const key of cache.keys()) {
        if (!key.includes(`viewerId:${JSON.stringify(userId)},`)) continue;
        const data = cache.get(key)?.data;
        if (!Array.isArray(data)) continue;
        const sample = data.flat().find(Boolean);
        if (!sample || typeof sample.id !== "string" || !("totalLikes" in sample) || !("actions" in sample)) continue;
        void mutate(key, (current: any) => Array.isArray(current) ? current.map((page: any) =>
          Array.isArray(page) ? page.map(post => updateReaction(post, id, kind, value)) : updateReaction(page, id, kind, value)
        ) : current, { revalidate: false });
      }
    };
    try {
      await runReaction(`${userId}:${kind}:${id}`, selected, apply, async () => {
        const result: any = await (kind === "like" ? postReaction(id, token) : kind === "bookmark" ? bookmarkPost(id, token) : updateRePost(id, token));
        const confirmed = kind === "like" ? result?.liked : kind === "bookmark" ? result?.isBookmarked : result?.isReposted;
        if (typeof confirmed === "boolean") apply(confirmed);
      });
    } catch {
      // A timeout may occur after the server committed: reconcile in the background.
      void revalidate();
      notifications.show("Couldn't save your reaction. Your previous selection has been restored. Please try again.", { severity: "error", autoHideDuration: 5000 });
    }
  }, [userId, token, mutatePostLikes, mutatePostBookmarks, mutatePostReposts, cache, mutate, notifications, revalidate]);
  return {
    handleReaction: useCallback((ev: any, id: string, value: boolean) => perform(ev, id, value, "like"), [perform]),
    handleBookmark: useCallback((ev: any, id: string, value: boolean) => perform(ev, id, value, "bookmark"), [perform]),
    handleRepost: useCallback((ev: any, id: string, value: boolean) => perform(ev, id, value, "repost"), [perform]),
  };
}
