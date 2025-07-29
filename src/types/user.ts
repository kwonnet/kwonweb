import { UserRoleEnum, UserTypeEnum } from ".";


type UserMeta = {
    type: string;
    color: string;
    status: string;
    isPro: boolean
    isLegacy: boolean
    isActive: boolean,
    [key: string]: any
};

type UserCountry =  {
        id: string;
        name: string;
        iso2: string;
        iso3: string;
        emoji: string;
        continentId: string;
    }

export interface UserPublic {
    id: string;
    avatar?: string | null;
    username: string;
    name: string;
    bio: string;
    role: UserRoleEnum;
    userType: UserTypeEnum;
    meta: UserMeta
    country?: UserCountry;
}

export interface UserConnection extends UserPublic {
    followBack: boolean;
    hasFollowed: boolean;

}

export interface UserConnection extends UserPublic {
    followBack: boolean,
    hasFollowed: boolean;

}

export interface UserFollower extends UserPublic {
    followerCount: number;
    followingCount: number;
}

export interface UserMiniProfile extends UserPublic {
    followerCount: number;
    followingCount: number;
    mutualCount: number;
    followers: UserFollower[];
}