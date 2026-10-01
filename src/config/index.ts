import { publicEnv } from "@/config/public-env";
export const constant = {
  siteName: "Kwonnet", //"Torazon" | "Kuonnet" | "Kounnet",
  siteDescription:
    "A revolutionary social networking platform that connects people from all walks of life, fostering meaningful connections and empowering individuals to achieve their dreams.",
};

export const siteUrl = publicEnv("NEXT_PUBLIC_APP_URL")

export const apiUrl = `${publicEnv("NEXT_PUBLIC_API_URL")}/api/v1`;

export const apiBaseUrl = `${publicEnv("NEXT_PUBLIC_API_URL")}`;

export const appLogo = publicEnv("NEXT_PUBLIC_APP_LOGO");

export const appUrl = publicEnv("NEXT_PUBLIC_APP_URL");

export const vapidPublicKey = publicEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY")

export const flwPublicKey = publicEnv("NEXT_PUBLIC_FLUTTERWAVE_PUBK")

export const flwRedirectUrl = publicEnv("NEXT_PUBLIC_FLUTTERWAVE_REDIRECT_URL")


