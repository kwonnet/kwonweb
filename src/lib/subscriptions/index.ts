import { axiosAPI } from "@/config/axios";
import {
  PlanTypeEnum,
  TxnCurrencyEnum,
  TxnGatewayEnum,
  TxnSourceEnum,
} from "@/types";
import { getErrorMessage } from "@/utils";

export const genTmaSubscriptionInvoice = async (
  config: {
    planId: string;
    tierId: string | undefined;
    gateway: TxnGatewayEnum;
    amount: number;
    botTxnRef: string;
    planType: PlanTypeEnum;
    currency: TxnCurrencyEnum;
    isRecurring: boolean;
    planName: string;
  },
  token?: string
) => {
  try {
    axiosAPI.accessToken = token;
    const result = await axiosAPI.post("/v1/subscriptions/invoices", config);
    return result.data;
  } catch (error) {
    throw error;
  }
};
export const subscribePremium = async (
  payload: {
    planId: string;
    amount: number;
    currency: TxnCurrencyEnum;
    planType: PlanTypeEnum;
    gateway: TxnGatewayEnum;
    source: TxnSourceEnum;
    planName: string;
    isRecurring: boolean;
    subPlanId?: string | null;
    meta?: object;
  },
  accessToken?: string
) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.post("/v1/subscriptions/premium", payload);
    return { data: result.data, message: "Subscription successful" };
  } catch (error: any) {
    return { data: null, message: getErrorMessage(error) };
  }
};

export const cancelSubscription = async (id: string, accessToken?: string) => {
  try {
    axiosAPI.accessToken = accessToken;
    const result = await axiosAPI.post("/v1/subscriptions/cancel", { id });
    return { data: result.data, message: "Subscription cancelled" };
  } catch (error: any) {
    return { data: null, message: getErrorMessage(error) };
  }
};
