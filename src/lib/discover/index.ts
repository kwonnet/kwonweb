import { axiosAPI } from "@/config/axios";
import { TrendingTopics } from "@/types";
import { composeUrlQuery } from "@/utils";
import { cache } from "react";

export const getTrendingTopics = cache(async (args:{country?: string | null, limit: number}, accessToken?: string) => {
    try {
      const queryString = composeUrlQuery(args)
      axiosAPI.accessToken = accessToken;
      console.log("getTrendingTopics ", queryString)
      const result = await axiosAPI.get(`/v1/discover/trend?${queryString}`);
      return result.data as TrendingTopics[];
    } catch (error: any) {
      throw error
    }
  })