import { UserRoleEnum, UserTypeEnum } from ".";

export enum UserAccountStatus {
  ACTIVE = "ACTIVE",
  BANNED = "BANNED",
  DEACTIVATED = "DEACTIVATED",
  SUSPENDED = "SUSPENDED",
  PRIVATE = "PRIVATE",
}
export interface FollowResponse {
  status: string;
  senderId: string;
  recipientId: string;
  action: FollowAction;
}

export interface UserMeta {
  type: string;
  color: string;
  status: string;
  isPro: boolean;
  isLegacy: boolean;
  isActive: boolean;
  isPrivate: boolean;
  tier: number;
  level: number;
  message: string;
  accountStatus: UserAccountStatus;
  [key: string]: any;
}

type UserCountry = {
  id: string;
  name: string;
  iso2: string;
  iso3: string;
  emoji: string;
  continentId: string;
};

export enum FollowAction {
  FOLLOW = "FOLLOW",
  UNFOLLOW = "UNFOLLOW",
  ACCEPT = "ACCEPT",
  REJECT = "REJECT",
  CANCEL = "CANCEL",
}

export enum FollowStatus {
  ACCEPTED = "ACCEPTED",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
}

export interface UserPublic {
  id: string;
  avatar?: string | null;
    banner?: string | null;
    website?: string | null;
  username: string;
  name: string;
  bio: string;
  role: UserRoleEnum;
  userType: UserTypeEnum;
  meta: UserMeta;
  createdAt: Date | string;
  country?: UserCountry;
}

export interface UserConn {
  followerCount: number;
  followingCount: number;
  mutualCount: number;
  isFollowingUser: boolean;
  isFollowedByUser: boolean;
  followingStatus?: FollowStatus;
  followedStatus?: FollowStatus;
}

export interface MutualFollower {
  id: string;
  name: string;
  avatar?: string | null;
  username: string;
  conn: {
    followerCount: number;
    followingCount: number;
  };
}

export interface UserConnection extends UserPublic {
  conn: UserConn;
  mutualFollowers: MutualFollower[];
}

export interface UserMiniProfile extends UserPublic {
  conn: UserConn;
  mutualFollowers: MutualFollower[];
  stats: {
    totalReplies: number;
    totalMediaPosts: number;
    totalPosts: number;
    totalBookmarks: number;
    totalHighlights: number;
    totalLikes: number;
    totalScheduled: number;
  };
  actions: {
    hasBlockedUser: boolean;
    isBlockedByUser: boolean;
    hasMutedUser: boolean;
    isMutedByUser: boolean;
  };
}

export interface AccountAnalytics {
  title: string;
  value: number;
  change: string;
}

export interface UserStats {
  totalAwards: number;
  totalTxns: number;
  totalInvites: number;
  totalEarned: number;
  totalTaskNotDone: number;
  totalTaskDone: number;
  totalUnreadCount: number;
  totalUnseenCount: number;
  totalUnreadMsg: number;
  totalUnseenMsg: number;
}
