export const NEWSFEED_PAGE_SIZE = 21;
export const newsfeedKey = <T extends string>(userId: string, feed: T, pageIndex: number) => ({
  viewerId: userId, userId, feed, limit: NEWSFEED_PAGE_SIZE, page: pageIndex + 1,
});
