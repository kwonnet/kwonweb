import { PostType } from "@/types";


export enum FeedTypeEnum {
  FORYOU = "forYou",
  FOLLOWING = "following",
  LATEST = "latest",
  FRIENDS = "friends"
}

export enum PostMediaAction {
  VIEW = "VIEW",
  WATCH = "WATCH",
  DOWNLOAD = "DOWNLOAD"
}

export enum PostMediaKind {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO"
}
export interface PostMediaLog {
  postId: string;
  mediaId: string;
  muted: boolean;
  timestamp: string;
  duration: number;
  playbackRate: number;
  watchedPct: number;
  sessionId?: string | null
  kind: PostMediaKind,
  action: PostMediaAction
  sessionDuration?: number
}

export type PostFile = { file: File; id: string; altText: string; flags: string[] };


export type TagUser = {
  id: string;
  name: string;
  username: string;
  avatar: string;
};

export enum PollScopeEnum {
  NONE = "NONE",
  COUNTRY = "COUNTRY",
  CONTINENT = "CONTINENT",
}

export type PollOption = { id: string; text: string };

export type PollDuration = {
  days: number;
  hours: number;
  minutes: number;
};

export type PollThread = {
  scope: PollScopeEnum;
  isMultiVote: boolean;
  duration: PollDuration;
  options: PollOption[];
  continents: string[];
  countries: string[];
};

export type QuizDuration =  {
  days: number;
  hours: number;
  minutes: number;
};
export type QuizOption = { id: string; text: string, isCorrect: boolean };

export enum QuizScopeEnum {
  NONE = "NONE",
  COUNTRY = "COUNTRY",
  CONTINENT = "CONTINENT",
}
export type QuizThread = {
  scope: QuizScopeEnum;
  isPaid: boolean;
  rewardAmount: number;
  duration: QuizDuration;
  options: QuizOption[];
  maxWinners: number
  continents: string[];
  countries: string[];
};
export interface PostThread {
  id: number;
  files: PostFile[];
  content: string;
  type: PostType;
  poll?: PollThread;
  quiz?: QuizThread;
  tags: string[],
  mentions: string[],
  tagUsers: TagUser[]
  isOpenTagUser: boolean
};

export enum PostScopeEnum {
  ANYONE = "ANYONE",
  VERIFIED = "VERIFIED",
  FOLLOWED = "FOLLOWED",
  MENTIONS = "MENTIONS",
}

type PostMedia = {
    fileId: string;
    name: string;
    url: string;
    height: number;
    width: number;
    size: number;
    thumbnailUrl?: string;
    fileType: string;
    filePath: string;
    altText?: string;
    flags: string[];
}

interface CreatePostThread extends Omit<PostThread, "id" | "files" | "tagUsers" | "isOpenTagUser"> {
    media: PostMedia[];
    scope: PostScopeEnum;
    tagUsers: string[];
}

export interface PostCreate {
  thread: CreatePostThread[]
  scheduleAt?: string | Date;
  location?: string;
  isDraft: boolean;
}