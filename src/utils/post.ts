import { FeedPost, PostAuthor } from "@/types";
import { PostScopeEnum } from "@/types/post";

export const getScopeMessage = (item: FeedPost) => {
  if (item.scope === PostScopeEnum.ANYONE) {
    return "Anyone can reply";
  }
  if (item.scope === PostScopeEnum.FOLLOWED) {
    return `Only accounts that @${item.author.username} follows, mentioned, or tagged can reply to this post `;
  }
  if (item.scope === PostScopeEnum.VERIFIED) {
    return `Only verified and accounts mentioned or tagged by @${item.author.username} can reply to this post `;
  }
  if (item.scope === PostScopeEnum.MENTIONS) {
    return `Only accounts that @${item.author.username} mentioned or tagged can reply to this post `;
  }
  return "You can't reply to this post";
};

export const getConnBtnColor = (item: PostAuthor, btnHover: boolean) => {
  const isFriends = item.conn.isFollowing && item.conn.isFollowed;
  return (isFriends || item.conn.isFollowed) && btnHover
    ? "error"
    : isFriends
      ? "success"
      : item.conn.isFollowed
        ? "warning"
        : item.conn.isFollowing
          ? "info"
          : "inherit";
};
export const getConnBtnText = (item: PostAuthor, btnHover: boolean) => {
  const isFriends = item.conn.isFollowing && item.conn.isFollowed;
  return btnHover && (isFriends || item.conn.isFollowed)
    ? "Unfollow"
    : item.conn.isFollowed
      ? "Following"
      : item.conn.isFollowing
        ? "Follow Back"
        : "Follow";
};
