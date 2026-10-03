import { Upload } from "tus-js-client";

export type VideoUploadPhase =
  | "queued"
  | "uploading"
  | "paused"
  | "retrying"
  | "processing"
  | "ready"
  | "error";
export type VideoUploadProgress = {
  id: string;
  name: string;
  phase: VideoUploadPhase;
  percent: number;
  message?: string;
};
export type VideoInput = { file: File; altText?: string; flags?: string[] };
export type VideoUploadControls = {
  pause: () => Promise<void>;
  resume: () => void;
};
type Session = {
  id: string;
  uploadUrl: string;
  expiresAt: string;
  maxDurationSeconds: number;
  uploaded?: boolean;
};
type Status = {
  ready: boolean;
  failed: boolean;
  state: string;
  progress: number;
  error?: string;
  url?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
};
const canceled = () =>
  new DOMException(
    "Upload canceled. Your draft is still available.",
    "AbortError",
  );
const check = (signal: AbortSignal) => {
  if (signal.aborted) throw canceled();
};
async function api<T>(
  path: string,
  signal: AbortSignal,
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const result = await response.json();
  if (!response.ok)
    throw Object.assign(
      new Error(result.error || "Video service unavailable. Please try again."),
      { status: response.status },
    );
  return result;
}
export function waitForVideoPoll(
  ms: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(canceled());
    const abort = () => {
      clearTimeout(timer);
      reject(canceled());
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}
function readSession(key: string): Session | undefined {
  try {
    const session = JSON.parse(sessionStorage.getItem(key) || "null");
    if (
      session &&
      Date.parse(session.expiresAt) > Date.now() &&
      /^[a-f0-9]{32}$/i.test(session.id) &&
      isUploadUrl(session.uploadUrl)
    )
      return session;
    sessionStorage.removeItem(key);
  } catch {
    /* Storage may be disabled. Upload still works. */
  }
}
function isUploadUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (url.hostname.endsWith(".videodelivery.net") ||
        url.hostname.endsWith(".cloudflarestream.com"))
    );
  } catch {
    return false;
  }
}
function saveSession(key: string, value: Session) {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const oldKey = sessionStorage.key(i);
      if (oldKey?.startsWith("kwonnet-stream:")) readSession(oldKey);
    }
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Resuming across reloads is optional. */
  }
}
export async function uploadStreamVideo(
  input: VideoInput,
  options: {
    owner: string;
    signal: AbortSignal;
    onProgress: (progress: Omit<VideoUploadProgress, "id" | "name">) => void;
    controls: (controls: VideoUploadControls | null) => void;
  },
  dependencies: { Upload?: typeof Upload; pollInterval?: number } = {},
) {
  const { file } = input;
  const { owner, signal, onProgress, controls } = options;
  check(signal);
  if (!owner) throw new Error("Sign in before uploading a video.");
  if (!file.type.startsWith("video/") || file.size < 1 || file.size > 1024 ** 3)
    throw new Error("Choose a video smaller than 1 GiB.");
  // Bind resumable capabilities to the signed-in user and selected file, including content.
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.slice(0, 65536).arrayBuffer(),
  );
  const fingerprint = `${owner}:${file.name}:${file.size}:${file.lastModified}:${Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")}`;
  const key = `kwonnet-stream:${fingerprint}`;
  let session = readSession(key);
  let status: Status | undefined;
  if (session) {
    try {
      status = await api<Status>(`/api/uploads/videos/${session.id}`, signal);
    } catch (error) {
      if ((error as { status?: number }).status === 404) session = undefined;
      else throw error;
    }
    if (status?.failed) {
      session = undefined;
      status = undefined;
    }
  }
  if (!session) {
    session = await api<Session>("/api/uploads/videos", signal, {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    saveSession(key, session);
  }
  check(signal);
  if (
    !status?.ready &&
    !session.uploaded &&
    (!status || status.state === "pendingupload")
  ) {
    const current = session;
    await new Promise<void>((resolve, reject) => {
      let paused = false,
        settled = false,
        percent = 0;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", abort);
        controls(null);
        error ? reject(error) : resolve();
      };
      const TusUpload = dependencies.Upload || Upload;
      const upload = new TusUpload(file, {
        uploadUrl: current.uploadUrl,
        chunkSize: 10 * 1024 * 1024, // tus chunks must be a multiple of 256 KiB and >= 5 MiB.
        retryDelays: [0, 3000, 5000, 10000, 20000],
        storeFingerprintForResuming: false,
        onProgress(bytes, total) {
          percent = Math.min(100, Math.round((bytes / total) * 100));
          if (!paused && !settled) onProgress({ phase: "uploading", percent });
        },
        onShouldRetry(error) {
          const code = error.originalResponse?.getStatus();
          if (
            paused ||
            signal.aborted ||
            (code && code >= 400 && code < 500 && code !== 408 && code !== 429)
          )
            return false;
          onProgress({
            phase: "retrying",
            percent,
            message: "Connection interrupted. Retrying automatically…",
          });
          return true;
        },
        onError(error) {
          const status =
            "originalResponse" in error
              ? error.originalResponse?.getStatus()
              : undefined;
          if (status && [401, 403, 404, 410].includes(status)) {
            try {
              sessionStorage.removeItem(key);
            } catch {
              /* Storage unavailable. */
            }
            finish(
              new Error(
                "The upload link expired. Submit your draft again to start a fresh upload.",
              ),
            );
          } else
            finish(
              new Error(
                "Video upload interrupted. Submit again to resume your upload.",
              ),
            );
        },
        onSuccess() {
          current.uploaded = true;
          saveSession(key, current);
          finish();
        },
        onBeforeRequest(request) {
          const xhr = request.getUnderlyingObject();
          if (
            typeof XMLHttpRequest !== "undefined" &&
            xhr instanceof XMLHttpRequest
          ) {
            xhr.timeout = 300_000;
            // tus' XHR stack handles onerror, but not ontimeout. Forward timeouts
            // so they enter the same bounded retry path instead of hanging.
            xhr.ontimeout = (event) => xhr.onerror?.call(xhr, event);
          }
        },
      });
      const abort = () => {
        void upload.abort().catch(() => {});
        finish(canceled());
      };
      signal.addEventListener("abort", abort, { once: true });
      controls({
        async pause() {
          if (settled || paused) return;
          paused = true;
          await upload.abort();
          if (!settled) onProgress({ phase: "paused", percent });
        },
        resume() {
          if (settled || !paused || signal.aborted) return;
          paused = false;
          onProgress({ phase: "uploading", percent });
          upload.start();
        },
      });
      onProgress({ phase: "uploading", percent: 0 });
      if (signal.aborted) abort();
      else upload.start();
    });
  }
  controls(null);
  const deadline = Date.now() + 10 * 60 * 1000;
  let failures = 0;
  while (!status?.ready) {
    check(signal);
    if (Date.now() >= deadline)
      throw new Error(
        "Your video is still processing. Keep your draft and submit again shortly; the video will not be uploaded again.",
      );
    try {
      status = await api<Status>(`/api/uploads/videos/${session.id}`, signal);
      failures = 0;
    } catch (error) {
      check(signal);
      const code = (error as { status?: number }).status;
      if (++failures >= 5 || code === 401 || code === 404) throw error;
      await waitForVideoPoll(5000, signal);
      continue;
    }
    if (status.failed)
      throw new Error(status.error || "Video processing failed.");
    if (!status.ready) {
      onProgress({
        phase: "processing",
        percent: status.progress,
        message:
          "Preparing playback quality. Your post will publish when the video is ready.",
      });
      await waitForVideoPoll(dependencies.pollInterval ?? 3000, signal);
    }
  }
  check(signal);
  onProgress({ phase: "ready", percent: 100 });
  return {
    fileId: session.id,
    name: file.name,
    url: status.url!,
    height: status.height!,
    width: status.width!,
    size: file.size,
    thumbnailUrl: status.thumbnailUrl!,
    fileType: file.type,
    filePath: `stream/${session.id}`,
    altText: input.altText || "",
    flags: input.flags || [],
  };
}
