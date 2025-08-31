import { PostAuthor } from "@/types";
import { FollowAction, FollowStatus, UserConn, UserConnection, UserFollower, UserMeta, UserMiniProfile } from "@/types/user";
import { ButtonProps } from "@mui/material";

export const composeMutualText = ({
  followers,
  total,
}: {
  followers?: UserFollower[];
  total: number;
}) => {
  if (followers?.length === 0) return "";
  const msg = followers?.map((conn) => conn?.name).join(", ");
  const count = followers?.length || 0;
  if (total > count) {
    return `Followed by ${msg} and ${total - count} that you also follow`;
  }
  return `Followed by ${msg} that you also follow`;
};

export const getUserConnInfo = (conn: UserMiniProfile["conn"]) => {

  const followingStatus = conn?.followingStatus;

  const followedStatus = conn?.followedStatus;

  const isFriends =
    conn?.isFollowingUser &&
    conn?.isFollowedByUser &&
    followingStatus === FollowStatus.ACCEPTED &&
    followedStatus === FollowStatus.ACCEPTED;

  const isConnected =
    isFriends ||
    followingStatus === FollowStatus.ACCEPTED ||
    followedStatus === FollowStatus.ACCEPTED;

  const followingText =
    followingStatus === FollowStatus.ACCEPTED
      ? "Following"
      : followingStatus === FollowStatus.PENDING
        ? "Accept Request"
        : "Follow";

  const followedText =
    followedStatus === FollowStatus.ACCEPTED
      ? "Following"
      : followedStatus === FollowStatus.PENDING
        ? "Cancel Request"
        : "Follow";

  return { isConnected, isFriends, followingText, followedText };
};


export const getConnBtnInfo = (
  item: UserMiniProfile["conn"],
  btnHover: boolean
): { btnText: string, btnColor: ButtonProps['color']} => {
  const { isFriends } = getUserConnInfo(item);
  if (
    isFriends ||
    (item?.followedStatus === FollowStatus.ACCEPTED &&
      item?.followingStatus !== FollowStatus.PENDING)
  ) {
    return { btnText: btnHover ? "Unfollow" : "Following", btnColor: btnHover ? "error": "success" }
  }
  if (
    item?.followingStatus === FollowStatus.ACCEPTED &&
    !item.isFollowedByUser
  ) {
    return { btnText: "Follow Back", btnColor: "info" }
  }
  if (
    (item?.followingStatus === FollowStatus.PENDING &&
      !item.isFollowedByUser) ||
    (item?.followingStatus === FollowStatus.PENDING &&
      item?.followingStatus === FollowStatus.PENDING)
  ) {
    return { btnText: "Consent", btnColor: "warning" }
  }
  if (item?.followedStatus === FollowStatus.PENDING) {
    return { btnText: "Cancel", btnColor: "secondary" }
  }
  return { btnText: "Follow", btnColor: "inherit" }
};


export const getFollowStatus = (conn: UserConn, meta: UserMeta, action: FollowAction) => {
  const isPrivate = meta?.isPrivate;
  if (action === FollowAction.FOLLOW) {
    conn = {
      ...conn,
      isFollowedByUser: true,
      followedStatus: isPrivate ? FollowStatus.PENDING : FollowStatus.ACCEPTED,
    };
  } else if (action === FollowAction.ACCEPT) {
    conn = {
      ...conn,
      isFollowingUser: true,
      followingStatus: FollowStatus.ACCEPTED
    };
  } 
  else if (action === FollowAction.CANCEL || action === FollowAction.UNFOLLOW) {
    conn = {
      ...conn,
      isFollowedByUser: false,
      followedStatus: FollowStatus.REJECTED,
    };
  } 
  else {
    conn = {
      ...conn,
      isFollowingUser: false,
      followingStatus: FollowStatus.REJECTED
    };
  }
  return conn;
};


export const getFollowAction = (isFriends: boolean, followedStatus?: FollowStatus  ) => {
    return isFriends ||
      followedStatus === FollowStatus.ACCEPTED
      ? FollowAction.UNFOLLOW
      : followedStatus === FollowStatus.PENDING
        ? FollowAction.CANCEL
        : FollowAction.FOLLOW;
  };
