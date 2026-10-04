/** Seed only missing entries; never overwrite reactions or already loaded pages. */
export function missingFeedEntries<T>(
  cache: { get: (key: string) => { data?: unknown } | undefined },
  pageKey: string,
  listKey: string,
  posts: T[],
): Array<[string, T[] | T[][]]> {
  const entries: Array<[string, T[] | T[][]]> = [];
  const cachedPages = cache.get(listKey)?.data as T[][] | undefined;
  const firstPage = cachedPages?.[0] ?? (cache.get(pageKey)?.data as T[] | undefined) ?? posts;
  if (cache.get(pageKey)?.data === undefined) entries.push([pageKey, firstPage]);
  if (cachedPages === undefined) entries.push([listKey, [firstPage]]);
  return entries;
}
