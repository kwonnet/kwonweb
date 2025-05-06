import { MutatorCallback } from "swr";
import { PostScopeEnum } from "./post";
import { SWRInfiniteMutatorOptions } from "swr/infinite";


export type SwrGenericMutateFunction<T> = (
  data?:
    | T[][]
    | Promise<T[][] | undefined>
    | MutatorCallback<T[][]>
    | undefined,
  opts?:
    | boolean
    | SWRInfiniteMutatorOptions<T[][], T[][]>
    | undefined
) => Promise<T[][] | undefined>;


// export type FeedMutateFunction = (
//   data?:
//     | FeedPost[][]
//     | Promise<FeedPost[][] | undefined>
//     | MutatorCallback<FeedPost[][]>
//     | undefined,
//   opts?:
//     | boolean
//     | SWRInfiniteMutatorOptions<FeedPost[][], FeedPost[][]>
//     | undefined
// ) => Promise<FeedPost[][] | undefined>;


export enum PostPinContext {
  PROFILE = "PROFILE",
  COMMUNITY = "COMMUNITY",
  GLOBAL = "GLOBAL"
}

export enum ReportReasonCode {
  HATE = "HATE",
  ABUSE = "ABUSE",
  VIOLENCE = "VIOLENCE",
  CHILD_SAFETY = "CHILD_SAFETY",
  PRIVACY = "PRIVACY",
  SPAM = "SPAM",
  SELF_HARM = "SELF_HARM",
  SENSITIVE_MEDIA = "SENSITIVE_MEDIA",
  IMPERSONATION = "IMPERSONATION",
  VIOLENT_ENTITIES = "VIOLENT_ENTITIES",
  COPYRIGHT = "COPYRIGHT",
}

export enum UserRoleEnum {
    SUPER = "SUPER",
    ADMIN = "ADMIN",
    USER = "USER",
  }
  
  export enum UserTypeEnum {
    INDIVIDUAL = "INDIVIDUAL",
    ORGANIZATION = "ORGANIZATION",
    GOVERNMENT = "GOVERNMENT",
  }

  export type User = {
    id: string;
    name: string;
    telId?: string;
    username: string;
    // avatar: string;
    // role: UserRoleEnum;
    email: string;
    accessToken: string;
    // userType: UserTypeEnum;
    // meta: {
    //   type: "LEGACY" | "PRO";
    //   status: "ACTIVE" | "INACTIVE" | "PAUSED";
    //   color: "blue" | "gold" | "grey";
    //   isActive: boolean;
    //   isPro: boolean;
    //   isLegacy: boolean;
    // };
  };
  
  export type CurrentAuthUser = {
    id: string;
    name: string;
    telId: string;
    username: string;
    avatar: string;
    role: UserRoleEnum;
    email: string;
    userType: UserTypeEnum;
    meta: {
      type: "LEGACY" | "PRO";
      status: "ACTIVE" | "INACTIVE" | "PAUSED";
      color: "blue" | "gold" | "grey";
      isActive: boolean;
      isPro: boolean;
      isLegacy: boolean;
    };
  };

  export enum GameRoomRankingEnum {
    MONTH = "month",
    WEEK = "week",
    TODAY = "today",
    YEAR = "year",
  }
  
  export enum GameType {
    TRIVIA = "TRIVIA",
    ACRONYM = "ACRONYM",
    MINDMASH = "MINDMASH",
    SPORTS = "SPORTS",
    COUNTRY = "COUNTRY",
    ACADEMIA = "ACADEMIA",
  }
  
  export enum GameCatType {
    TYPEMANIA = "TYPEMANIA",
    HANGMAN = "HANGMAN",
    ANAGRAM = "ANAGRAM",
    UNSCRAMBLE = "UNSCRAMBLE",
    LUCKYFLIP = "LUCKYFLIP",
    WORDMAKER = "WORDMAKER",
    LUCKYWHIZ = "LUCKYWHIZ",
    LUCKYSPIN = "LUCKYSPIN"
  }
  
  export interface CoinPackage {
    id: string;
    name: string;
    amount: number;
    price: number;
    bonus: number;
    isActive: boolean;
  }
  
  export enum TxnCurrencyEnum {
    TZX = "TZX",
    TON = "TON",
    XTR = "XTR",
    USDT = "USDT",
    USD = "USD",
    FIAT = "FIAT",
    NONE = "NONE",
  }
  
  export enum TxnSourceEnum {
    CREDIT = "CREDIT",
    COINS = "COINS",
    BONUS = "BONUS",
    COINS_BONUS = "COINS_BONUS",
    STARS = "STARS",
    FIAT = "FIAT",
    CRYPTO = "CRYPTO",
    VIRTUAL = "VIRTUAL",
  }
  
  export enum CryptoName {
    TON = "TON",
  }
  
  export interface CryptoAddress {
    id: string;
    address: string;
    rate: number;
    name: CryptoName;
  }
  
  export type GameAchievement = {
    id: string;
    reason: string;
    rewardType: string;
    amount: number;
    description: string;
    thumbnail: string;
    playerId: string;
    createdAt: string;
    category: {
      id: string;
      name: string;
    };
  };
  
  export enum BonusTypeEnum {
    BONUS = "BONUS",
    ADS = "ADS",
  }
  
  export interface Game {
    id: string;
    name: string;
    description: string;
    thumbnail: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface GameCategory {
    id: string;
    name: string;
    description: string;
    thumbnail: string | null;
    gameId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface GameRoom {
    id: string;
    name: string;
    description: string;
    thumbnail: string | null;
    participants: number;
    capacity: number;
    userId: string;
    catId: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export enum GameStatusEnum {
    CHAT = "CHAT",
    PLAY = "PLAY",
    VOTE = "VOTE",
  }
  export enum GameEventEnum {
    GAME_ROOM_CHAT = "game_room_chat",
    GAME_ROOM_SCORE = "game_room_score",
    GAME_ROOM_STATE = "game_room_state",
    GAME_ROOM_PLAYERS = "game_room_players",
    GAME_ROOM_QUESTION = "game_room_question",
    GAME_ROOM_ANSWER = "game_room_answer",
    GAME_ROOM_ANSWERS = "game_room_answers",
    GAME_ROOM_VOTE = "game_room_vote",
    GAME_ROOM_PARTICIPANTS = "game_room_participants",
    GAME_TOTAL_PLAYERS = "game_total_players",
    GAME_ERROR_NOTIFY = "game_error_notify",
    GAME_PLAYER_DATA = "game_player_data",
    GAME_PLAYER_ENERGY = "game_player_energy",
    GAME_PLAYER_WALLET_UPDATE = "game_player_wallet_update",
    GAME_ROOM_ACHIEVEMENT = "game_room_achievement",
    GAME_ROOM_INFO = "game_room_info",
    PLAYER_JOINED = "player_joined",
    DISCONNECTED = "disconnected",
    MESSAGE = "message",
    NOTIFY_MESSAGE = "notify_message",
  }
  
  export interface ThemedGameQuestion {
    id: string | number;
    question: string;
    options: string[];
    answer: string;
  }
  
  export interface ChatMessage {
    id: string;
    createdAt: string;
    playerName: string;
    playerId: string;
    content: string;
  }
  
  export enum TxnStatusEnum {
    COMPLETED = "COMPLETED",
    PROCESSING = "PROCESSING",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED",
  }
  
  export type Transaction = {
    id: string;
    amount: number;
    description: string;
    type: "CREDIT" | "DEBIT";
    status: TxnStatusEnum;
    currency: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  
  export interface GameRoomPlayer {
    playerId: string;
    name: string;
    socketId: string;
    roomId: string;
    voteCount: number;
  }
  
  export interface GamePlayer {
    id: string;
    name: string;
    numPlayed: number;
    score: number;
    rank?: number;
  }
  
  export interface GameEnergy {
    id: string;
    catId: string;
    createdAt: Date;
    updatedAt: Date;
    amount: number;
    playerId: string;
    gauge: number;
    turbo: number;
  }
  
  export interface GameWallet {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    amount: number;
    bonus: number;
    credit: number;
  }
  
  
  
  export interface GameRoomInfo {
    gameId: string;
    gameName: string;
    gameType: GameType;
    catType?: GameCatType;
    catName: string;
    catId: string;
    roomId: string;
  }
  
  export interface GameRoomAnswer {
    qId: number | string;
    answer: string;
    answerId: string;
    timer: number;
    votes: any[];
    name: string;
    room: string;
    playerId: string;
    catId: string;
    roomId: string;
    gameType: GameType;
    voted: boolean;
    score: number;
  }
  
  export interface ThemedGameScore {
    roomId: string;
    playerId: string;
    name: string;
    answer: string;
    timer: number;
    score: number;
  }
  
  export interface Wallet {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    credit: number;
    amount: number;
    bonus: number;
    isLocked?: boolean;
  }
  
  export interface CurrUserStats {
    totalInvites: number;
    totalEarned: number;
    totalAwards: number;
    totalTxns: number;
    totalTaskNotDone: number;
    totalTaskDone: number;
  }
  
  export interface GameCategoryRanking {
    userId: string | null;
    name: string;
    description: string;
    thumbnail: string | null;
    gameId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    totalParticipants: number;
    game: {
      name: string;
      id: string;
    };
  }
  
  export interface UserCategoryRanking {
    rank: number;
    score: number;
    numPlayed: number;
    id: string;
    name: string;
    createdAt: string;
    lastLoggedIn: string;
    category: {
      game: {
        id: string;
        name: string;
      };
    } & {
      id: string;
      name: string;
      gameId: string;
    };
  }
  
  export interface GameMonthRewardStat {
    month: number;
    year: number;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    catId: string;
    numPlayed: number;
    totalParticipants: number;
    rewardParticipants: number;
    coinsRewardParticipants: number;
    totalScore: number;
  }
  
  // export interface GameWinnersStats {
  //   id: string;
  //   name: string;
  //   gameId: string;
  //   game: {
  //     id: string;
  //     name: string;
  //   };
  //   year: number;
  //   month: number;
  //   catId: string;
  //   rewardStats: GameMonthRewardStat;
  // }
  
  export interface GameWinnersStats {
    stats: {
        categories: {
            cat: GameCategory & { game: Game },
            rewardStats: GameMonthRewardStat;
        }[];
        month: number;
    }[];
    year: number;
  }
  
  export interface GameWinner {
    catId: string;
    year: number;
    month: number;
    playerId: string;
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    score: number;
    rank: number;
    numPlayed: number;
    txn: {
      id: string;
      description: string;
      userId: string;
      amount: number;
      currency: string;
      source: string;
      createdAt: Date | string;
      updatedAt: Date | string;
    };
  }
  
  // export interface GameRankingArchiveStats {
  //   year: number;
  //   month: number;
  //   catId: string;
  //   totalParticipants: number;
  //   id: string;
  //   name: string;
  //   gameId: string;
  //   game: {
  //     id: string;
  //     name: string;
  //   };
  // }
  
  export interface GameRankingArchiveStats {
    stats: {
        categories: {
            cat: GameCategory & { game: Game },
            totalParticipants: number;
        }[];
        month: number;
    }[];
    year: number;
  }
  
  export interface GameArchiveUser {
    name: string;
    month: number;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    year: number;
    catId: string;
    playerId: string;
    rank: number;
    score: number;
    numPlayed: number;
  }
  
  export interface SubFlwPaymentPlan {
    flwId: number;
    flwToken: string;
    flwCreatedAt: string;
    flwStatus: string;
    flwInterval: string;
    flwCurrency: string;
    flwAmount: number;
    flwDuration: number;
    tierId: string | null;
    id: string;
    name: string;
    planRef: string;
  }
  
  export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    discount: number;
    accountType: UserTypeEnum;
    createdAt: Date;
    updatedAt: Date;
    tier: { id: string; name: string; price: number; message: string }[];
    metadata?: { flw: SubFlwPaymentPlan[]} | null;
    features: {
      id: string;
      name: string;
      items: {
        id: string;
        title: string;
        label: string;
        [key: string]: any;
      }[];
      planId: string;
    }[];
  }
  
  export interface Subscription {
    id: string;
    metadata: unknown[];
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    planId: string;
    isRecurring: boolean;
    startDate: Date;
    endDate: Date;
    billingCycle: PlanTypeEnum;
    status: string;
    meta: { [key: string]: any } | null;
    plan: SubscriptionPlan;
  }
  
  export enum PlanTypeEnum {
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY",
  }
  
  export enum RewardTypeEnum {
    COINS = "COINS",
    BONUS = "BONUS",
    CREDIT = "CREDIT",
  }
  
  export interface Task {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    code?: string | null;
    userId: string;
    title: string;
    description: string;
    url: string;
    reward: number;
    rewardType: RewardTypeEnum;
  }
  
  export enum TxnGatewayEnum {
    STARS = "STARS",
    SMART_GLOCAL = "SMART_GLOCAL",
    UNLIMINT = "UNLIMINT",
    CRYPTO = "CRYPTO",
    VIRTUAL = "VIRTUAL",
    WALLET = "WALLET",
    FLUTTERWAVE = "FLUTTERWAVE",
    PAYSTACK = "PAYSTACK",
  }
  
  export interface PaymentSubscriptionOptions {
    amount: number;
    price: number;
    planId: string;
    tierId?: string;
    currency: TxnCurrencyEnum;
    gateway: TxnGatewayEnum;
    source: TxnSourceEnum;
    discount: number;
    planName: string;
    metadata?: { flw: SubFlwPaymentPlan[]} | null
  }
  
  
  export type PostMedia = {
    id: string;
    postId: string;
    fileId: string;
    name: string;
    url: string;
    height: number;
    width: number;
    size: number;
    thumbnailUrl: string;
    fileType: string;
    filePath: string;
    altText?: string;
    flags: string[];
    meta?: Record<string, any>;
    totalViews: number;
    totalDownloads: number;
    createdAt: Date;
    updatedAt: Date;
  };
  
  export enum PostKind {
    "ROOT" = "ROOT",
    "THREAD" = "THREAD",
    "REPLY" = "REPLY",
    "REPOST" = "REPOST",
    "QUOTE" = "QUOTE",
  }
  
  export enum PostType {
    "CONTENT" = "CONTENT",
    "POLL" = "POLL",
    "QUIZ" = "QUIZ",
  }

  export interface PostAuthor {
    id: string;
    avatar?: string;
    username: string;
    role: string;
    name: string;
    userType: string;
    country?: any;
    bio?: any;
    conn: { isFollowed: boolean, isFollowing: boolean}
    meta: {
        type: string;
        color: string;
        status: string;
        isPro: boolean;
        isLegacy: boolean;
        isActive: boolean;
    };
}

  
  export interface FeedPost {
    id: string;
    content?: string;
    type: PostType;
    kind: PostKind;
    scope: PostScopeEnum;
    deletedAt?: string | Date | null;
    totalViews: number;
    totalLikes: number;
    totalReplies: number;
    totalShares: number;
    totalBookmarks: number;
    totalReposts: number;
    totalQuotes: number;
    totalImpressions: number;
    totalHiddenReplies: number;
    isHidden: boolean;
    media: PostMedia[];
    parentId?: string;
    quotedPostId?: string;
    userId: string;
    countryId?: string;
    meta?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    parent: FeedPost
    replies: FeedPost[]
    author: PostAuthor,
    actions: { 
        hasReposted: boolean;
        hasSaved: boolean;
        hasLiked: boolean;
        canReply: boolean; 
        canHideReply: boolean;
    }
    poll?: {
      id: string;
      continents: string[];
      countries: string[];
      createdAt: string;
      expireAt: string;
      isExpired: boolean;
      hasVoted: boolean;
      canVote: boolean;
      isMultiVote: boolean;
      options: {
          id: string;
          pollId: string;
          text: string;
          votes: number;
          createdAt: string;
          voters: any[]
      }[];
      postId: string;
      scope: string;
      updatedAt: string;
    }
    quiz?: {
      id: string;
      continents: string[];
      countries: string[];
      createdAt: string;
      expireAt: string;
      isExpired: boolean;
      hasVoted: boolean;
      canVote: boolean;
      isPaid: boolean;
      rewardAmount: number;
      maxWinners: number;
      options: {
          id: string;
          quizId: string;
          text: string;
          isCorrect: boolean;
          votes: number;
          createdAt: string;
          participants: any[]
      }[];
      postId: string;
      scope: string;
      updatedAt: string;
    },
  };
  
  export interface FeedPostDetail extends FeedPost {
    thread: FeedPost[]
    replies: FeedPost[]
    parentChain: FeedPost[]
  };
  
  export type Country = {
    id: string;
    name: string;
    iso2: string;
    iso3: string;
    emoji: string;
  };
  
  export type Continent = {
    id: string;
    name: string;
    code: string;
    countries: Country[];
  }

//   notifications

export enum INotificationKind {
    COMMENT = "COMMENT",
    REACTION = "REACTION",
    SUBSCRIPTION = "SUBSCRIPTION",
  }
  
  export interface AppNotification {
    id: string;
    message: string;
    kind: INotificationKind;
    createdAt: Date | string;
    isSeen: boolean;
    isRead: boolean;
    video: {
      id: string;
      title: string;
      videoId: string;
      thumbnail: string;
    };
    comment?: {
      id: string;
      content: string;
    };
    sender: {
      id: string;
      name: string;
      image?: string;
    };
    recipient: {
      id: string;
      name: string;
      image?: string;
    };
  }
  

  export enum ConnTypeEnum {
    SUGGESTED = "suggested",
    MUTUAL_FOLLOWS = "mutual_follows",
    POPULAR_CREATORS = "popular_creators",
    INTEREST = "interest",
    NEAR_YOU = "near_you"
  }