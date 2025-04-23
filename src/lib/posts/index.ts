import { axiosAPI } from "@/config/axios";
import { FeedPost, PostAuthor } from "@/types";
import { composeUrlQuery, getErrorMessage } from "@/utils";
import { cache } from "react";
import { PostCreate } from "@/types/post";

export const createPost = async (body: PostCreate, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.post("/v1/posts", body);
    return { data: result.data, message: "Post created successfully" };
  } catch (error: any) {
    return { data: null, message: getErrorMessage(error) };
  }
};

export const getNewsfeed = cache(async (feedType: any, accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.get(`/v1/posts/feed/${feedType}`);
      return result.data as FeedPost[];
    } catch (error: any) {
      throw error
    }
  })

export const postReaction = async (id: string, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.post(`/v1/posts/${id}/reactions`, { id });
    return result.data as FeedPost;
  } catch (error: any) {
    throw error
  }
}

export const bookmarkPost = async (id: string, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.post(`/v1/posts/${id}/bookmarks`, { id });
    return result.data as FeedPost;
  } catch (error: any) {
    throw error
  }
}

export const shareFeedPost = async (id: string, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.post(`/v1/posts/${id}/shares`, { id });
    return result.data as FeedPost;
  } catch (error: any) {
    console.log("share error ",error)
    throw error
  }
}

export const updateRePost = async (id: string, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.post(`/v1/posts/${id}/reposts`, { id });
    return result.data as FeedPost;
  } catch (error: any) {
    throw error
  }
}

export const createPostQuote = async (postId: string, body: PostCreate, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.post(`/v1/posts/${postId}/quotes`, body);
    return { data: result.data, message: "Quote sent" };
  } catch (error: any) {
    return { data: null, message: getErrorMessage(error) };
  }
};

export const createPostReply= async (postId: string, body: PostCreate, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.post(`/v1/posts/${postId}/replies`, body);
    return { data: result.data, message: "Reply sent" };
  } catch (error: any) {
    return { data: null, message: getErrorMessage(error) };
  }
};

export const votePollPost = async (postId: string, optionId: string, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.patch(`/v1/posts/${postId}/poll`, { optionId });
    return result.data as FeedPost;
  } catch (error: any) {
    throw error
  }
}

export const voteQuizPost = async (postId: string, optionId: string, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.patch(`/v1/posts/${postId}/quiz`, { optionId });
    return result.data as FeedPost;
  } catch (error: any) {
    throw error
  }
}

export const getPostReplies = cache(async (args:{id: string, limit: number, page?: number}, accessToken?: string) => {
  try {
    const queryString = composeUrlQuery(args)
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.get(`/v1/posts/${args.id}/replies?${queryString}`);
    return result.data as FeedPost[];
  } catch (error: any) {
    throw error
  }
})

export const getPostQuotes = cache(async (args:{id: string, limit: number, page?: number}, accessToken?: string) => {
  try {
    const queryString = composeUrlQuery(args)
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.get(`/v1/posts/${args.id}/quotes?${queryString}`);
    return result.data as FeedPost[];
  } catch (error: any) {
    throw error
  }
})

export const getPostReposts = cache(async (args:{id: string, limit: number, page?: number}, accessToken?: string) => {
  try {
    const queryString = composeUrlQuery(args)
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.get(`/v1/posts/${args.id}/reposts?${queryString}`);
    return result.data as PostAuthor[];
  } catch (error: any) {
    throw error
  }
})
