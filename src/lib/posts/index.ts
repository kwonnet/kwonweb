import { axiosAPI } from "@/config/axios";
import { FeedPost, PostAuthor, PostPinContext, ReportReasonCode } from "@/types";
import { composeUrlQuery, getErrorMessage } from "@/utils";
import { cache } from "react";
import { FeedTypeEnum, PostClickLog, PostCreate, PostMediaLog, PostTipBody } from "@/types/post";
import debounce from "lodash/debounce";
import { UserConnection } from "@/types/user";

export const createPost = async (body: PostCreate, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.post("/v1/posts", body);
    return { data: result.data, message: "Post created successfully" };
  } catch (error: any) {
    return { data: null, message: getErrorMessage(error) };
  }
};

export const getNewsfeed = cache(async (args:{feed: FeedTypeEnum, limit: number, page?: number}, accessToken?: string) => {
    try {
      const queryString = composeUrlQuery(args)
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.get(`/v1/posts/feed/${args.feed}?${queryString}`);
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

export const shareFeedPost = async (body: {
    id: string;
    kind?: string;
    sessionId: string;
    timestamp: string;
}, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.post(`/v1/posts/${body.id}/shares`, body);
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

export const updateNotInterestedPost = async (id: string, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.post(`/v1/posts/${id}/not-interested`, { id });
    return result.data as { postId: string, userId: string};
  } catch (error: any) {
    throw error
  }
}


export const reportPost = async (body: {code: ReportReasonCode, id: string, message?: string, meta: { title: string, description: string, code: ReportReasonCode }}, accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.post(`/v1/posts/${body.id}/reports`, body);
      return { data: result.data, message: "Post reported successfully" };
    } catch (error: any) {
      return { data: null, message: getErrorMessage(error) }
    }
  }

  export const pinPost = async (body: {id: string, context: PostPinContext}, accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.post(`/v1/posts/${body.id}/pins`, body);
      const data = result.data as { id: string, userId: string, isPinned: boolean}
      return { data, message: data.isPinned ? "Post pined successfully" : "Post unpinned" };
    } catch (error: any) {
      return { data: null, message: getErrorMessage(error) }
    }
  }

  export const highlightPost = async (body: {id: string, context: PostPinContext}, accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.post(`/v1/posts/${body.id}/highlights`, body);
      const data = result.data as { id: string, userId: string, isHighlighted: boolean}
      return { data, message: data.isHighlighted ? "Post highlighted successfully" : "Post highlight removed" };
    } catch (error: any) {
      return { data: null, message: getErrorMessage(error) }
    }
  }
  export const deletePost = async (id: string, accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.delete(`/v1/posts/${id}`);
      const data =  result.data as { id: string, userId: string, deletedAt?: string | Date};
      return { data, message: "Post deleted" };

    } catch (error: any) {
      return { data: null, message: getErrorMessage(error) }
    }
  }
  export const hideReply = async (id: string, accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.patch(`/v1/posts/${id}/replies`, {});
      const data =  result.data as { id: string, userId: string, hidden: boolean};
      return { data, message: data.hidden ? "Reply hidden" : "Reply shown" };

    } catch (error: any) {
      return { data: null, message: getErrorMessage(error) }
    }
  }

  export const trackImpression = debounce(async (body: {id: string, sessionId: string}, accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.post(`/v1/posts/${body.id}/impressions`, body);
      return result.data
    } catch (error: any) {
      throw error
    }
  }, 1000)


  export const sendPostLog = async (body: PostMediaLog, accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.post(`/v1/posts/${body.postId}/media`, body);
      return { data: result.data, message: "Media log created successfully" };
    } catch (error: any) {
      return { data: null, message: getErrorMessage(error) };
    }
  };

  export const sendPostClick = async (body: PostClickLog, accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.post(`/v1/posts/${body.id}/clicks`, body);
      return { data: result.data, message: "Post click logged successfully" };
    } catch (error: any) {
      return { data: null, message: getErrorMessage(error) };
    }
  };

  export const sendPostTip = async (body: PostTipBody, accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.post(`/v1/posts/${body.postId}/tips`, body);
      return { data: result.data, message: "Tip sent" };
    } catch (error: any) {
      return { data: null, message: getErrorMessage(error) };
    }
  };

  

export const getPostReplies = cache(async (args:{id: string, limit: number, page?: number; hidden?:boolean}, accessToken?: string) => {
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
    return result.data as UserConnection[];
  } catch (error: any) {
    throw error
  }
})

export const getPostTagUsersOrMentions = cache(async (args:{id: string, query: string; limit: number, page?: number}, accessToken?: string) => {
  try {
    const queryString = composeUrlQuery(args)
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.get(`/v1/posts/${args.id}/mentions?${queryString}`);
    return result.data as UserConnection[];
  } catch (error: any) {
    throw error
  }
})
