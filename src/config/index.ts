export const constant = {
  siteName: "Torazon",
  siteDescription:
    "A revolutionary social networking platform that connects people from all walks of life, fostering meaningful connections and empowering individuals to achieve their dreams.",
};

export const siteUrl = process.env.NEXT_PUBLIC_APP_URL

export const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;

export const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

// Bunny Config
export const bunnyVideoLibraryId =
  process.env.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID;

export const bunnyStorageUrl = process.env.NEXT_PUBLIC_BUNNY_STORAGE_URL;

export const bunnyTusEndpoint = process.env.NEXT_PUBLIC_BUNNY_TUS_ENDPOINT;

//  Bunny stream
export const bunnyStreamSecurityKey = process.env.BUNNY_STREAM_SECUIRTY_KEY;

export const bunnyStreamKey = process.env.BUNNY_STREAM_API_KEY;

export const bunnyStreamUrl = process.env.NEXT_PUBLIC_BUNNY_VIDEO_STREAM_URL;

// Bunny storage

export const bunnyStorageRegion = process.env.BUNNY_STORAGE_REGION;

export const bunnyStorageBaseHostName = process.env.BUNNY_STORAGE_HOSTNAME;

export const bunnyStorageZone = process.env.BUNNY_STORAGE_ZONE;

export const bunnyStorageApiKey = process.env.BUNNY_STORAGE_API_KEY;

export const bunnyFilenameUID =
  process.env.NEXT_PUBLIC_BUNNY_STORAGE_UPLOAD_FILE_UID;

// Bunny pull zone
export const bunnyPullZoneUrl = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_URL;

export const bunnyPullZone = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE;

// Bunny webhook

export const bunnyWebhookUrl = process.env.BUNNY_STREAM_API_WEBHOOK_URL;

export const bunnyWebhookApiKey = process.env.BUNNY_STREAM_API_WEBHOOK_KEY;

// player cookie name

export const playerCookieKey = "v__p_ss";
