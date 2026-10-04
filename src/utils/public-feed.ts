import { PostKind, PostType, UserRoleEnum, UserTypeEnum, type FeedPost, type PostMedia } from "@/types";
import { PostScopeEnum } from "@/types/post";
import { UserAccountStatus, type UserConnection } from "@/types/user";

export type PublicPostPreview = {
  id: string; content: string | null; createdAt: string; userId: string;
  author: { id: string; name: string; username: string; avatar: string | null };
  totalLikes: string; totalReplies: string; totalReposts: string;
  totalQuotes?: string; totalShares?: string; totalBookmarks?: string;
  totalImpressions?: string; totalTips?: string; totalViews?: string;
  media: { id: string; fileId: string; url: string; thumbnailUrl: string | null; fileType: string; altText: string | null; width: number; height: number }[];
};

const count = (value?: string) => Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Number(value) || 0));

/** Presentation defaults only. No account/session or permissions are created for guests. */
export function publicPreviewAuthor(post: PublicPostPreview): UserConnection {
  return {
    id: post.author.id || post.userId, name: post.author.name, username: post.author.username,
    avatar: post.author.avatar, bio: "", role: UserRoleEnum.USER, userType: UserTypeEnum.PERSONAL,
    createdAt: post.createdAt, mutualFollowers: [],
    conn: { followerCount: 0, followingCount: 0, mutualCount: 0, isFollowingUser: false, isFollowedByUser: false },
    meta: { type: "", color: "", status: "", isPro: false, isLegacy: false, isActive: true,
      isPrivate: false, tier: 0, level: 0, message: "", accountStatus: UserAccountStatus.ACTIVE },
  };
}

/** Adapt the small public DTO to the existing feed card's presentation model. */
export function publicPreviewCard(post: PublicPostPreview): FeedPost {
  const author = publicPreviewAuthor(post);
  const date = new Date(post.createdAt);
  const card: Omit<FeedPost, "parent"> = {
    id: post.id, userId: post.userId, content: post.content ?? "", createdAt: date, updatedAt: date,
    type: PostType.CONTENT, kind: PostKind.ROOT, scope: PostScopeEnum.ANYONE, isHidden: false,
    totalLikes: count(post.totalLikes), totalReplies: count(post.totalReplies), totalReposts: count(post.totalReposts),
    totalQuotes: count(post.totalQuotes), totalShares: count(post.totalShares), totalBookmarks: count(post.totalBookmarks),
    totalImpressions: count(post.totalImpressions), totalTips: count(post.totalTips), totalViews: count(post.totalViews), totalHiddenReplies: 0,
    author: { ...author, avatar: author.avatar ?? undefined }, replies: [], parentChain: [], tagUsers: [], mentions: [],
    media: post.media.map(media => ({ ...media, postId: post.id, thumbnailUrl: media.thumbnailUrl ?? "",
      altText: media.altText ?? undefined, width: media.width || 0, height: media.height || 0,
      name: "", size: 0, filePath: "", flags: [], totalViews: 0, totalDownloads: 0, createdAt: date, updatedAt: date } satisfies PostMedia)),
    actions: { hasLiked: false, hasSaved: false, hasReposted: false, hasPinned: false, hasHighlighted: false,
      canReply: false, canHideReply: false, hasBlockedUser: false, isBlockedByUser: false, hasMutedUser: false,
      isMutedByUser: false, hasBlockedByRootUser: false, isRootBlockedByUser: false, hasMutedByRootUser: false, isRootMutedByUser: false },
  };
  // The legacy FeedPost type requires parent, but root payloads have no parent.
  // Only CONTENT/ROOT cards enter this adapter; no parent-dependent UI is rendered.
  return card as FeedPost;
}
