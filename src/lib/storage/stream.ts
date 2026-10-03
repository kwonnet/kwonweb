import { createHash } from "node:crypto";

export const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;
const UID = /^[a-f0-9]{32}$/i;
const MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/ogg",
  "video/x-matroska",
  "video/mpeg",
  "video/avi",
  "video/x-msvideo",
]);
export class StreamError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
export const creatorId = (userId: string) =>
  createHash("sha256").update(`kwonnet:${userId}`).digest("hex");
export type StreamConfig = {
  accountId: string;
  token: string;
  appUrl: string;
  maxDuration: number;
};
export function streamConfig(): StreamConfig {
  const {
    CLOUDFLARE_ACCOUNT_ID: accountId,
    CLOUDFLARE_ACCOUNT_API_TOKEN: token,
    NEXT_PUBLIC_APP_URL: appUrl,
  } = process.env;
  const maxDuration = Number(
    process.env.CLOUDFLARE_STREAM_MAX_DURATION_SECONDS || 600,
  );
  if (
    !accountId ||
    !UID.test(accountId) ||
    !token ||
    !appUrl ||
    !Number.isInteger(maxDuration) ||
    maxDuration < 1 ||
    maxDuration > 3600
  )
    throw new StreamError(
      "Video uploads are not configured. Please contact support.",
      503,
    );
  try {
    new URL(appUrl);
  } catch {
    throw new StreamError("Video uploads are not configured.", 503);
  }
  return { accountId, token, appUrl, maxDuration };
}
export function validateVideo(input: unknown): {
  name: string;
  size: number;
  type: string;
} {
  if (!input || typeof input !== "object")
    throw new StreamError("Select a video to upload.");
  const { name, size, type } = input as Record<string, unknown>;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 255 ||
    /[\x00-\x1f]/.test(name)
  )
    throw new StreamError("Invalid video filename.");
  if (
    typeof size !== "number" ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > MAX_VIDEO_BYTES
  )
    throw new StreamError("Videos must be between 1 byte and 1 GiB.");
  if (typeof type !== "string" || !MIME.has(type))
    throw new StreamError("Unsupported video format. Try MP4, MOV, or WebM.");
  return { name, size, type };
}
export function streamUploadUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      (u.hostname === "upload.videodelivery.net" ||
        u.hostname.endsWith(".videodelivery.net") ||
        u.hostname.endsWith(".cloudflarestream.com"))
    );
  } catch {
    return false;
  }
}
function mediaUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      (u.hostname === "videodelivery.net" ||
        u.hostname.endsWith(".videodelivery.net") ||
        u.hostname.endsWith(".cloudflarestream.com"))
      ? value
      : "";
  } catch {
    return "";
  }
}
export function createStreamService(
  config: StreamConfig,
  fetcher: typeof fetch = fetch,
) {
  const base = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/stream`;
  const headers = { Authorization: `Bearer ${config.token}` };
  return {
    async create(userId: string, input: unknown) {
      const file = validateVideo(input);
      const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
      const metadata = {
        name: file.name,
        filename: file.name,
        filetype: file.type,
        maxDurationSeconds: String(config.maxDuration),
        expiry: expiresAt,
        allowedorigins: new URL(config.appUrl).hostname,
        thumbnailtimestamppct: "0.1",
      };
      const response = await fetcher(`${base}?direct_user=true`, {
        method: "POST",
        headers: {
          ...headers,
          "Tus-Resumable": "1.0.0",
          "Upload-Length": String(file.size),
          "Upload-Creator": creatorId(userId),
          "Upload-Metadata": Object.entries(metadata)
            .map(
              ([key, value]) =>
                `${key} ${Buffer.from(value).toString("base64")}`,
            )
            .join(","),
        },
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
        redirect: "error",
      });
      const uploadUrl = response.headers.get("Location") || "";
      const id = response.headers.get("stream-media-id") || "";
      if (!response.ok || !UID.test(id) || !streamUploadUrl(uploadUrl))
        throw new StreamError(
          "Could not prepare the video upload. Please try again shortly.",
          502,
        );
      return {
        id,
        uploadUrl,
        expiresAt,
        maxDurationSeconds: config.maxDuration,
      };
    },
    async status(userId: string, id: string) {
      if (!UID.test(id)) throw new StreamError("Video not found.", 404);
      const response = await fetcher(`${base}/${id}`, {
        headers,
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
        redirect: "error",
      });
      if (response.status === 404)
        throw new StreamError("Video not found.", 404);
      if (!response.ok)
        throw new StreamError("Video status is temporarily unavailable.", 502);
      const body = await response.json();
      const video = body.result;
      if (!body.success || !video)
        throw new StreamError("Video status is temporarily unavailable.", 502);
      if (video.creator !== creatorId(userId))
        throw new StreamError("Video not found.", 404);
      const hls = mediaUrl(video.playback?.hls);
      const thumbnail = mediaUrl(video.thumbnail);
      const failed = video.status?.state === "error";
      const ready =
        !failed &&
        video.readyToStream === true &&
        !!hls &&
        !!thumbnail &&
        video.input?.width > 0 &&
        video.input?.height > 0;
      return {
        id,
        ready,
        failed,
        state: String(video.status?.state || "pendingupload"),
        progress: Math.min(
          100,
          Math.max(0, Number(video.status?.pctComplete) || 0),
        ),
        error: failed
          ? "This video could not be processed. Check its format and duration, then choose another file."
          : undefined,
        url: ready ? hls : undefined,
        thumbnailUrl: ready ? thumbnail : undefined,
        width: ready ? Number(video.input.width) : undefined,
        height: ready ? Number(video.input.height) : undefined,
      };
    },
  };
}

// Bounds accidental/spam reservations per warm instance. Production-wide quotas belong in a shared store.
const reservations = new Map<string, { count: number; reset: number }>();
function reserve(userId: string) {
  const now = Date.now();
  for (const [key, value] of reservations)
    if (value.reset <= now) reservations.delete(key);
  const entry = reservations.get(userId) || {
    count: 0,
    reset: now + 3_600_000,
  };
  if (
    entry.count >= 10 ||
    (reservations.size >= 10000 && !reservations.has(userId))
  )
    throw new StreamError("Upload limit reached. Please try again later.", 429);
  entry.count++;
  reservations.set(userId, entry);
}
export function createStreamHandlers(deps: {
  userId: () => Promise<string | undefined>;
  config: () => StreamConfig;
  fetcher?: typeof fetch;
  reserve?: (userId: string) => void;
}) {
  const json = (value: unknown, status = 200) =>
    Response.json(value, {
      status,
      headers: { "Cache-Control": "private, no-store" },
    });
  const error = (err: unknown) =>
    json(
      {
        error:
          err instanceof StreamError
            ? err.message
            : "Video service is temporarily unavailable. Please try again.",
      },
      err instanceof StreamError ? err.status : 502,
    );
  return {
    async POST(request: Request) {
      try {
        const config = deps.config();
        if (request.headers.get("origin") !== new URL(config.appUrl).origin)
          throw new StreamError("Upload origin is not allowed.", 403);
        const userId = await deps.userId();
        if (!userId)
          throw new StreamError("Sign in before uploading a video.", 401);
        if (
          !request.headers.get("content-type")?.startsWith("application/json")
        )
          throw new StreamError("Expected JSON.", 415);
        // Read bounded metadata only: video bytes never travel through Next.js.
        const reader = request.body?.getReader();
        if (!reader) throw new StreamError("Missing upload details.");
        let data = "",
          size = 0;
        const decoder = new TextDecoder();
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          void reader.cancel().catch(() => {});
        }, 10_000);
        try {
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            size += part.value.byteLength;
            if (size > 4096)
              throw new StreamError("Upload details are too large.", 413);
            data += decoder.decode(part.value, { stream: true });
          }
          if (timedOut) throw new StreamError("Upload request timed out.", 408);
          data += decoder.decode();
        } finally {
          clearTimeout(timer);
          await reader.cancel().catch(() => {});
        }
        let input: unknown;
        try {
          input = JSON.parse(data);
        } catch {
          throw new StreamError("Invalid upload details.");
        }
        validateVideo(input);
        (deps.reserve || reserve)(userId);
        return json(
          await createStreamService(config, deps.fetcher).create(userId, input),
          201,
        );
      } catch (err) {
        return error(err);
      }
    },
    async GET(_request: Request, id: string) {
      try {
        const userId = await deps.userId();
        if (!userId)
          throw new StreamError("Sign in to check your upload.", 401);
        return json(
          await createStreamService(deps.config(), deps.fetcher).status(
            userId,
            id,
          ),
        );
      } catch (err) {
        return error(err);
      }
    },
  };
}
