import { axiosAPI } from "@/config/axios";
import { Continent } from "@/types";
import { cache } from "react";

export const getContinentsAndCountries = cache(async (accessToken?: string) => {
    try {
      axiosAPI.accessToken = accessToken;
      const result = await axiosAPI.get(`/v1/locations`);
      return result.data as Continent[];
    } catch (error: any) {
      throw error
    }
  })