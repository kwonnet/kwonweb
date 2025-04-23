import { bunnyFilenameUID, bunnyPullZoneUrl, bunnyStorageUrl } from "@/config";

import axios from "axios";
import { ZodError, ZodIssue, ZodSchema } from "zod";

import { customAlphabet } from "nanoid";

const numbersOnly = "0123456789";

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param array - The array to shuffle.
 * @returns The shuffled array.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffledArray = [...array]; // Create a copy to avoid mutating the original array
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Generate a random index from 0 to i
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Swap elements
  }
  return shuffledArray;
}

export const getInviteLink = (refId?: string | number) => {
  const url = `${process.env.NEXT_PUBLIC_TELEGRAM_BOT_APP_URL}`;
  return refId ? `${url}?startapp=${refId}` : url;
};

export const delayExecution = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getCurrent_ton_usd_rate = async () => {
  try {
    // const res = { data: { "the-open-network": { usd: 6.3 } } }; //await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd")
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd"
    );
    const result = res.data;
    const tonUsdRate = result["the-open-network"]["usd"];
    if (!tonUsdRate) return null;
    console.log(tonUsdRate);
    return tonUsdRate as number;
  } catch (error) {
    return null;
  }
};

export function formatNumber(num: number): string {
  if (num < 1000) return num.toString(); // Leave numbers < 1000 as they are
  const units = ["", "K", "M", "B", "T"]; // Define units (thousand, million, etc.)
  let unitIndex = 0;

  // Loop through the units until the number is less than 1000
  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }

  return `${num.toFixed(1).replace(/\.0$/, "")}${units[unitIndex]}`;
}

export function formatFeedNumber(num: number) {
  if(num === 0) return ""
  if (num < 1000) return num.toString(); // Leave numbers < 1000 as they are
  const units = ["", "K", "M", "B", "T"]; // Define units (thousand, million, etc.)
  let unitIndex = 0;
  // Loop through the units until the number is less than 1000
  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }
  return `${Math.round(num)}${units[unitIndex]}`;
}

export function formatNumberWithCommas(num: number): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function getTONRate(
  curr_ton_rate: number,
  stars_amount: number
): number {
  const rate = curr_ton_rate - 0.9;
  const stars_usd = stars_amount * 0.013;
  const tonRate = stars_usd / rate;
  return parseFloat(tonRate.toFixed(2));
}

export function get_ton_in_nano_ton(ton: number): number {
  return ton * 1_000_000_000; // Convert TON to nanoTON
}

export function get_ton_from_nano_ton(nanoTON: number): number {
  return nanoTON / 1_000_000_000; // Convert nanoTON to TON
}

export const get_tzx_usd_rate = (tzxAmount: number): number => {
  return parseFloat((tzxAmount * 0.013).toFixed(2));
};

export const get_usd_tzx_rate = (usdAmount: number): number => {
  return parseFloat((usdAmount / 0.013).toFixed(2));
};

export const get_usd_stars_rate = (usdAmount: number): number => {
  return parseFloat((usdAmount / 0.013).toFixed(2));
};

export const get_tzx_stars_rate = (tzxAmount: number): number => {
  return parseFloat(tzxAmount.toFixed(2));
};

export const get_usd_ton_rate = (
  usdAmount: number,
  tonRate: number
): number => {
  return parseFloat((usdAmount / tonRate).toFixed(2));
};

export const genUniqueRef = customAlphabet(numbersOnly, 16);

export function getWithrawalTxnFee(amount: number) {
  if (amount === 0) return 0;
  if (amount <= 500) {
    // fee should be $0.5
    return parseFloat((0.5 / 0.013).toFixed(2));
  }
  // fee should be $1
  return parseFloat((1 / 0.013).toFixed(2));
}

export const getErrorMessage = (error: any): string => {
  let message = error?.message;
  
  if (error?.response?.data) {
    message = error?.response?.data;
  }
  if(error instanceof ZodError){
    message = error.issues.map(issue => issue.message).toString()
  }
  return message as string;
};

export const validateZodInput = <T>(
  payload: T,
  schema: ZodSchema,
  isArrayErrorResult: boolean = false
): { message: string; data: T | null; errors?: string[] | Partial<T> } => {
  try {
    const parseResult = schema?.parse(payload);
    return { data: parseResult as T, message: "success", errors: undefined };
  } catch (error: any) {
    const issues: ZodIssue[] = error.issues ?? [];
    const message = issues.map((issue: ZodIssue) => issue.message).join("\r\n");

    if (isArrayErrorResult) {
      const errors: string[] = issues.map((issue: ZodIssue) => issue.message);
      return { message, data: null, errors };
    }

    const errors: Partial<T> = {};
    for (const issue of issues) {
      const field = issue.path[0];
      errors[field as keyof T] = issue.message as T[keyof T];
    }

    return { message, errors, data: null };
  }
};

export function getSWRData<T>(data?: { data: T[]; nextCursor: string }[]): T[] {
  return data
    ? data.reduce((prev, curr) => [...prev, ...(curr?.data ?? [])], [] as T[])
    : [];
}

export const checkSWRIsLoadingMore = ({
  isLoading,
  size,
  data,
}: {
  isLoading: boolean;
  size: number;
  data: any;
}): boolean => {
  return (
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined")
  );
};

export const checkSWRReachEnd = ({
  error,
  data,
  pageSize,
  total,
  totalCurr,
}: {
  error: any;
  data: any;
  pageSize: number;
  total: number;
  totalCurr: number;
}) => {
  const result =
    totalCurr >= total ||
    !!error ||
    (data && data[data.length - 1]?.data.length < pageSize);
  return Boolean(result);
};

export function composeUrlQuery(args: { [key: string]: any }): string {
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(args)) {
    if (value !== null && value !== undefined) {
      // If value is an object or array, serialize it
      queryParams.append(
        key,
        typeof value === "object" ? JSON.stringify(value) : String(value)
      );
    }
  }

  return queryParams.toString();
}

export function getRandomNumber(
  min: number,
  max: number,
  rounded: boolean = false
): number {
  const random = Math.random() * (max - min) + min;
  return rounded ? Math.round(random) : Math.round(random * 10) / 10; // Round to 1 decimal place
}

export const monthNames: { [key: number]: string } = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
};

export const formatDateTime = (date: Date | string) => {
  const intl = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium", // e.g., "Jan 1, 2024"
    timeStyle: "short", // e.g., "3:30 PM"
  });
  return intl.format(new Date(date));
};

function getISOWeek(date: Date): { year: number; week: number } {
  const tempDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  // Set the date to Thursday of the current week (ISO starts week on Monday)
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - (tempDate.getUTCDay() || 7));
  // First day of the year
  const startOfYear = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  // Calculate the ISO week number
  const week = Math.ceil(
    ((tempDate.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7
  );
  return { year: tempDate.getUTCFullYear(), week };
}

export function getCurrentDataInfo() {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // Month is 1-indexed for the key
  const day = date.getUTCDate();
  const { week } = getISOWeek(date);

  return { year, month, week, day };
}

export function getTimeDifference(dateInput: Date | string): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  // Parse the input into a Date object if it's a string
  const targetDate =
    typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  // Ensure the input is a valid Date object
  if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
    throw new Error("Invalid date input");
  }

  // Get the current time
  const currentDate = new Date();

  // Calculate the time difference in milliseconds
  const diffInMillis = targetDate.getTime() - currentDate.getTime();

  // Convert milliseconds to hours, minutes, and seconds
  const hours =
    Math.floor(Math.abs(diffInMillis) / (1000 * 60 * 60)) *
    Math.sign(diffInMillis);
  const minutes =
    Math.floor((Math.abs(diffInMillis) % (1000 * 60 * 60)) / (1000 * 60)) *
    Math.sign(diffInMillis);
  const seconds =
    Math.floor((Math.abs(diffInMillis) % (1000 * 60)) / 1000) *
    Math.sign(diffInMillis);

  return {
    hours,
    minutes,
    seconds,
  };
}

export const generateImagkitFilename = (
  id: string,
  limit: number = 10,
  folder?: string
) => {
  const trimId = id?.substring(id?.length - limit);
  if (!folder) return trimId;
  return `${trimId}_${folder?.toLowerCase()}`;
};

export const getFileExtension = (fileName: string) => {
  const parts = fileName.split(".");
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  return "";
};

export function formatRelativeTime(date: string | Date) {
  const relDate = new Date(date);
  const now = new Date().getTime();;
  const seconds = Math.floor((now - relDate.getTime()) / 1000);

  const intervals = [
    { label: "yr", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "w", seconds: 604800 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
    { label: "s", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label}`;
    }
  }

  return "1s"; // If less than 1 second, show "1s"
}

export const isMobileScreenshot = (width: number, height: number): boolean => {
  const aspectRatio = height / width;

  // Common mobile portrait aspect ratios with slight tolerance
  const mobileAspectRatios = [16 / 9, 19.5 / 9, 20 / 9, 21 / 9];
  const tolerance = 0.2; // Allow up to ±20% variation

  // Typical mobile screen width and height ranges
  const isMobileSize = width >= 360 && width <= 1440 && height >= 640 && height <= 3200;

  // Check if the aspect ratio is close to any mobile ratio
  const isMobileAspectRatio = mobileAspectRatios.some(
    (ratio) => Math.abs(aspectRatio - ratio) < tolerance
  );

  return isMobileSize && isMobileAspectRatio;
}

export function getMobileScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  screenWidth: number,
  screenHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let newWidth = screenWidth;
  let newHeight = newWidth / aspectRatio;

  if (newHeight > screenHeight) {
    newHeight = screenHeight;
    newWidth = newHeight * aspectRatio;
  }

  return { width: Math.round(newWidth), height: Math.round(newHeight) };
}
export const genVideoUrlInfo = (videoId: string, thumbnail: string) => {
  return {
    poster: `${thumbnail?.includes(bunnyFilenameUID) ? bunnyStorageUrl : bunnyPullZoneUrl}/${videoId}/${thumbnail}`,
    previewUrl: `${bunnyPullZoneUrl}/${videoId}/preview.webp`,
    hlsUrl: `${bunnyPullZoneUrl}/${videoId}/playlist.m3u8`,
    videoId,
    thumbnail,
  };
};

export function shortenText(text?: string, limit = 50): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
}
