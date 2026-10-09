// Explicit allowlist: these settings are intentionally visible to browsers.
export const publicEnvKeys = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_REGISTRATION_ENABLED",
  "NEXT_PUBLIC_APP_LOGO",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_FLUTTERWAVE_PUBK",
  "NEXT_PUBLIC_FLUTTERWAVE_REDIRECT_URL",
  "NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY",
  "NEXT_PUBLIC_IMAGEKIT_UPLOAD_DIR",
  "NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT",
  "NEXT_PUBLIC_MONETAG_ADS_SRC",
  "NEXT_PUBLIC_MONETAG_SDK",
  "NEXT_PUBLIC_MONETAG_ZONE",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
] as const;

export type PublicEnvKey = (typeof publicEnvKeys)[number];
export type PublicEnv = Partial<Record<PublicEnvKey, string>>;

declare global {
  interface Window {
    __KWONNET_PUBLIC_ENV__?: PublicEnv;
  }
}

export function publicEnv(key: PublicEnvKey): string | undefined {
  if (typeof window !== "undefined") {
    return window.__KWONNET_PUBLIC_ENV__?.[key];
  }
  // Dynamic access prevents Next.js from replacing the value at build time.
  return process.env[key];
}

export function publicEnvScript(): string {
  const values: PublicEnv = {};
  for (const key of publicEnvKeys) {
    const value = process.env[key];
    if (value !== undefined) values[key] = value;
  }
  // Prevent configuration values from closing an inline HTML script element.
  const json = JSON.stringify(values)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return `window.__KWONNET_PUBLIC_ENV__=${json};`;
}
