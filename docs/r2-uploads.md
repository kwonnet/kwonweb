# R2 image uploads

Posts, quotes and replies now upload images to `/api/uploads/images` on kwonweb. The Node.js route authenticates the existing Auth.js session, checks the request Origin against NEXT_PUBLIC_APP_URL, bounds the actual streamed body to 10 MiB, decodes/re-encodes images with sharp, strips metadata, and writes WebP objects using server-only R2 credentials. GIF animations are preserved within the frame/pixel limits. SVG is intentionally unsupported. Videos continue to use Bunny; unrelated ImageKit uploads are unchanged.

## Configure once

1. In Cloudflare R2, create a bucket for **public post media**. Do not use this flow for private messages or confidential files: media URLs are publicly readable.
2. Create an R2 S3 API token with Object Read & Write access restricted to that bucket. Copy its Access Key ID and Secret Access Key (not the token value).
3. Attach a custom domain such as `media.kwonnet.com` in the bucket's Settings → Custom Domains. Use a dedicated media hostname. Set `X-Content-Type-Options: nosniff` through a Cloudflare response header rule. Browser PUT/CORS permissions are unnecessary because uploads pass through the authenticated server.
4. Merge the R2 entries from `.env.example` into your existing `.env.local` for local development. Do not overwrite existing auth/API settings. On Cloud Run, add these as runtime environment variables/secrets to **kwonweb**, then deploy a new revision:

   - CLOUDFLARE_ACCOUNT_ID — Cloudflare account ID
   - CLOUDFLARE_ACCESS_KEY — scoped S3 key ID
   - CLOUDFLARE_SECRET_KEY — scoped S3 secret, preferably backed by Secret Manager
   - CLOUDFLARE_S3_API_ENDPOINT — account-level R2 HTTPS endpoint without a bucket path; defaults to `https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com` when empty
   - CLOUDFLARE_BUCKET_NAME — bucket name
   - CLOUDFLARE_PUBLIC_MEDIA_URL — `https://media.kwonnet.com` (public domain, not the S3 endpoint)
   - NEXT_PUBLIC_APP_URL — `https://kwonnet.com` (or `http://localhost:3000` locally)

CLOUDFLARE_ZONE_ID and CLOUDFLARE_ACCOUNT_API_TOKEN are not required by the S3 upload client. It uses CLOUDFLARE_ACCESS_KEY and CLOUDFLARE_SECRET_KEY instead.

Never prefix credentials with NEXT_PUBLIC_. Configuration is read at runtime; no R2 secrets are needed to build the Docker image. Use separate buckets/credentials for staging and production.

## Verify

Run `npm run test:uploads` and `npx tsc --noEmit`. Sign in, create a post, quote and reply with an image, and verify both the media URL and displayed image. Confirm upload requests without a session fail, unsupported/oversized files show an error, and video uploads still work. Existing Firebase URLs remain unchanged; do not delete the old bucket until existing objects and stored URLs have been migrated separately.

## Operational limits

Maximum 10 MiB input/output, 40 million decoded pixels, 100 animation frames, four simultaneous upload operations per process and 30 uploads per user per ten minutes per process. The browser queues images to limit bursts across threads. Limits reset on restart and are not shared across Cloud Run replicas: apply distributed authenticated quotas or an edge rate limit before scaling to untrusted high-volume traffic. Budget/usage alerts should cover R2 and kwonweb compute.

Uploads and post creation are separate operations. A failed/abandoned post can leave an unreferenced object; use reconciliation against saved media URLs before deleting old orphan objects. Do not apply a blanket expiry to published media. Public media removal/moderation and historical Firebase object migration are separate workflows.

References: [Cloudflare R2 S3 SDK configuration](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/) and [sharp image limits](https://sharp.pixelplumbing.com/api-constructor/).
