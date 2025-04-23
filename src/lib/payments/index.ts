import { axiosAPI } from "@/config/axios";
import { FlutterwaveConfig } from "flutterwave-react-v3/dist/types";

export const getFlwPaymentLink = async(config: FlutterwaveConfig, token?: string) => {
    try {
        axiosAPI.accessToken = token;
        const response = await axiosAPI.post("/v1/payments/flw/link", config);
        return response.data;
    } catch (error) {
        throw error;
    }
}