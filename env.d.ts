namespace NodeJS {
  interface ProcessEnv {
    // auth
    AUTH_SECRET: string;
    // api
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_APP_LOGO: streing;
    // vapid
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: string;
    // db config
    MONGODB_URI: string;

    // flutterwave
    NEXT_PUBLIC_FLUTTERWAVE_REDIRECT_URL: string;
    NEXT_PUBLIC_FLUTTERWAVE_PUBK: string;
    FLUTTERWAVE_SECK: string;
    FLUTTERWAVE_ENCK: string;

    // google analytics
    NEXT_PUBLIC_GTM_ID: string;
    NEXT_PUBLIC_GA_ID: string;
  }
}
