import { FeedPost, PostAuthor } from "@/types";
import { PostScopeEnum } from "@/types/post";
import { UserConnection } from "@/types/user";

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
  if (item.scope === PostScopeEnum.CONTINENT || item.scope === PostScopeEnum.COUNTRY) {
    return `Your location can't reply to this post`;
  }
  return "Your can't reply to this post";
};

export const getConnBtnColor = (item: PostAuthor["conn"], btnHover: boolean) => {
  const isFriends = item.isFollowingUser && item.isFollowedByUser;
  return btnHover && (isFriends || item.isFollowedByUser) 
    ? "error"
    : isFriends
      ? "success"
      : item.isFollowedByUser
        ? "warning"
        : item.isFollowingUser
          ? "info"
          : "inherit";
};

export const getConnBtnText = (item: PostAuthor['conn'], btnHover: boolean) => {
  
  const isFriends = item.isFollowingUser && item.isFollowedByUser;
  return btnHover && (isFriends || item.isFollowedByUser)
    ? "Unfollow"
    : item.isFollowedByUser
      ? "Following"
      : item.isFollowingUser
        ? "Follow Back"
        : "Follow";
};
