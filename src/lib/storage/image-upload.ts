import sharp from "sharp";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

export function assertUploadOrigin(request: Request, appUrl: string | undefined) {
  if (!appUrl) throw new UploadError("Upload service is not configured.", 503);
  if (request.headers.get("origin") !== new URL(appUrl).origin) {
    throw new UploadError("Upload origin is not allowed.", 403);
  }
}

export async function readLimitedBody(request: Request, timeoutMs = 15_000): Promise<Buffer> {
  const length = request.headers.get("content-length");
  if (length && Number(length) > MAX_IMAGE_BYTES) throw new UploadError("Images must be 10 MB or smaller.", 413);
  if (!request.body) throw new UploadError("An image is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new UploadError("Image upload timed out.", 408));
      void reader.cancel().catch(() => undefined);
    }, timeoutMs);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES) {
        await reader.cancel();
        throw new UploadError("Images must be 10 MB or smaller.", 413);
      }
      chunks.push(value);
    }
  } finally { clearTimeout(timer!); reader.releaseLock(); }
  if (!size) throw new UploadError("An image is required.");
  return Buffer.concat(chunks, size);
}

// Decode and re-encode: never publish arbitrary bytes based on a client MIME type.
// This strips EXIF/GPS and rejects SVG, malformed files and oversized animations.
export async function normalizeImage(bytes: Buffer) {
  try {
    const input = sharp(bytes, { animated: true, limitInputPixels: 40_000_000, failOn: "warning" });
    const meta = await input.metadata();
    if (!meta.format || !["jpeg", "png", "webp", "gif", "avif"].includes(meta.format)) throw new Error("format");
    if (!meta.width || !meta.height || meta.width * meta.height > 40_000_000 || (meta.pages || 1) > 100) throw new Error("dimensions");
    const { data, info } = await input.rotate().webp({ quality: 85 }).timeout({ seconds: 15 }).toBuffer({ resolveWithObject: true });
    if (data.length > MAX_IMAGE_BYTES) throw new UploadError("Processed image exceeds 10 MB.", 413);
    return { data, width: info.width, height: info.pageHeight || info.height };
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError("Use a valid JPEG, PNG, WebP, GIF or AVIF image (maximum 40 megapixels and 100 frames).");
  }
}

export function createImageUploadHandler(dependencies: {
  appUrl: () => string | undefined;
  userId: () => Promise<string | undefined>;
  store: (userId: string, image: Awaited<ReturnType<typeof normalizeImage>>) => Promise<unknown>;
}) {
// Bound decoding memory per server process. No unauthenticated body is consumed.
let active = 0;
const usage = new Map<string, { count: number; until: number }>();
return async function POST(request: Request) {
  let acquired = false;
  try {
    assertUploadOrigin(request, dependencies.appUrl());
    const userId = await dependencies.userId();
    if (!userId) throw new UploadError("Please sign in to upload images.", 401);
    const now = Date.now();
    for (const [id, entry] of usage) if (entry.until <= now) usage.delete(id);
    const entry = usage.get(userId) || { count: 0, until: now + 600_000 };
    if (active >= 4 || entry.count >= 30 || (!usage.has(userId) && usage.size >= 10_000)) throw new UploadError("Upload limit reached. Please try again later.", 429);
    entry.count++;
    usage.set(userId, entry);
    active++;
    acquired = true;
    const image = await normalizeImage(await readLimitedBody(request));
    const uploaded = await dependencies.store(userId, image);
    return Response.json(uploaded, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // Never log SDK/auth error objects: they can contain credentials or signed URLs.
    if (!(error instanceof UploadError)) console.error("Image upload failed", { type: error instanceof Error ? error.name : "UnknownError" });
    return Response.json({ error: error instanceof UploadError ? error.message : "Image upload failed. Please try again." }, { status: error instanceof UploadError ? error.status : 503, headers: { "Cache-Control": "no-store" } });
  } finally { if (acquired) active--; }
};
}
