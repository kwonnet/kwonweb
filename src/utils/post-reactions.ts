export type ReactionKind = "like" | "bookmark" | "repost";
const fields = {
  like: ["hasLiked", "totalLikes"],
  bookmark: ["hasSaved", "totalBookmarks"],
  repost: ["hasReposted", "totalReposts"],
} as const;

// Immutable, recursive updates keep originals and embedded reposts in sync.
export function updateReaction<T extends { id: string }>(post: T, id: string, kind: ReactionKind, selected: boolean, local = true): T {
  let next: any = post;
  if (post.id === id) {
    const [flag, count] = fields[kind];
    const current: any = post;
    const delta = local && !!current.actions?.[flag] === selected ? 0 : selected ? 1 : -1;
    next = { ...post, [count]: Math.max(0, (current[count] ?? 0) + delta),
      ...(local ? { actions: { ...current.actions, [flag]: selected } } : {}) };
  }
  for (const key of ["parent"] as const) {
    const value = (post as any)[key];
    if (!value) continue;
    const updated = Array.isArray(value)
      ? value.map(item => updateReaction(item, id, kind, selected, local))
      : updateReaction(value, id, kind, selected, local);
    next = { ...next, [key]: updated };
  }
  return next;
}

const pending = new Set<string>();
export const isReactionPending = (key: string) => pending.has(key);
// Toggle endpoints must never receive concurrent double clicks for one action.
export async function runReaction(key: string, selected: boolean, apply: (value: boolean) => void, request: () => Promise<unknown>) {
  if (pending.has(key)) return;
  pending.add(key);
  try {
    apply(selected);
    await request();
  } catch (error) {
    apply(!selected);
    throw error;
  } finally {
    pending.delete(key);
  }
}

export function updateDisplayedPages<T>(cached: T[][] | undefined, displayed: T[][] | undefined, update: (pages: T[][] | undefined) => T[][] | undefined) {
  return update(cached ?? displayed);
}
