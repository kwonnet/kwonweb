import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function config() {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY;
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_KEY;
  const bucket = process.env.CLOUDFLARE_BUCKET_NAME;
  const publicUrl = process.env.CLOUDFLARE_PUBLIC_MEDIA_URL;
  if (!account || !/^[a-f0-9]{32}$/i.test(account) || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) throw new Error("R2 configuration is incomplete");
  const endpoint = new URL(process.env.CLOUDFLARE_S3_API_ENDPOINT || `https://${account}.r2.cloudflarestorage.com`);
  const allowedHosts = [ `${account}.r2.cloudflarestorage.com`, `${account}.eu.r2.cloudflarestorage.com`, `${account}.fedramp.r2.cloudflarestorage.com` ];
  if (endpoint.protocol !== "https:" || !allowedHosts.includes(endpoint.hostname) || endpoint.port || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== "/") {
    throw new Error("CLOUDFLARE_S3_API_ENDPOINT must be the account's R2 HTTPS endpoint without a bucket path");
  }
  const base = new URL(publicUrl);
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash) throw new Error("CLOUDFLARE_PUBLIC_MEDIA_URL must be a public HTTPS base URL");
  return { endpoint: endpoint.origin, accessKeyId, secretAccessKey, bucket, publicUrl: base.href.replace(/\/$/, "") };
}
let client: S3Client | undefined;
export async function storeImage(userId: string, image: { data: Buffer; width: number; height: number }) {
  const c = config();
  client ??= new S3Client({ region: "auto", endpoint: c.endpoint, credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey }, maxAttempts: 2 });
  const fileId = randomUUID();
  const name = `${fileId}.webp`;
  const owner = createHash("sha256").update(userId).digest("hex");
  const filePath = `uploads/${owner}/${name}`;
  await client.send(new PutObjectCommand({ Bucket: c.bucket, Key: filePath, Body: image.data, ContentType: "image/webp", ContentLength: image.data.length, ContentDisposition: "inline", CacheControl: "public, max-age=31536000, immutable" }), { abortSignal: AbortSignal.timeout(30_000) });
  const url = `${c.publicUrl}/${filePath}`;
  return { fileId, name, filePath, url, thumbnailUrl: url, fileType: "image/webp", size: image.data.length, width: image.width, height: image.height };
}
