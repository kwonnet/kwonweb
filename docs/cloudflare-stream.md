# Cloudflare Stream video uploads

New post, quote, and reply videos upload directly from the browser to Cloudflare Stream using tus. Images continue to use R2 and `media.kwonnet.com`. Stream is a separate Cloudflare product with its own storage/delivery billing and playback hostnames.

## Runtime configuration

Enable Stream on the Cloudflare account, then configure these **server-side** environment variables in Cloud Run (and `.env.local` for local development):

```dotenv
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_ACCOUNT_API_TOKEN=your_account_scoped_stream_edit_token
NEXT_PUBLIC_APP_URL=https://kwonnet.com
CLOUDFLARE_STREAM_MAX_DURATION_SECONDS=600
```

The token must have **Account > Stream > Edit**, limited to the account identified above. R2 access/secret keys cannot authorize Stream. Never prefix the token with `NEXT_PUBLIC_`. The application reads these values at runtime; deploy a new Cloud Run revision after changing them. No Stream webhook, custom media domain, signing key, or database migration is required for this upload flow.

`NEXT_PUBLIC_APP_URL` must be the exact browser origin, including scheme and local development port. It controls upload CSRF checks and the Stream allowed playback hostname. Use separate app/Cloudflare configuration for staging. Additional embedding hostnames require intentionally extending the server-controlled allowed origins; clients cannot supply them.

The default duration limit is 10 minutes, configurable from 1 to 3,600 seconds. Each file is capped at 1 GiB. The API permits common video MIME types; Cloudflare checks actual media validity and enforces duration when processing. A file with forged MIME cannot become a playable post merely by declaring itself a video.

## Flow

1. The authenticated browser sends filename, MIME type, and byte count to `POST /api/uploads/videos`. The server verifies the configured origin, bounds the request body, validates metadata, and creates a short-lived direct creator tus URL. The Cloudflare token never reaches the browser.
2. The browser uploads with 10 MiB tus chunks and bounded automatic retries. The composer shows queued, uploading, paused, reconnecting, processing, and ready states, with pause/resume/cancel. Video uploads within one composer run sequentially. The composer cannot be dismissed or edited while submitting.
3. Authenticated `GET /api/uploads/videos/{id}` checks Cloudflare's creator field against a hash of the current user's ID. Other users cannot inspect an upload through this endpoint. Responses are not cached.
4. Processing is polled for up to ten minutes. Posts publish only after Stream reports playable HLS, a thumbnail, and dimensions. A processing timeout preserves the draft; submitting again checks the existing upload instead of sending its bytes again.
5. The existing media fields store the UID, full HLS URL, full thumbnail URL, dimensions, and a `stream/{uid}` path marker. Vidstack keeps adaptive playback, seeking, quality selection, casting, and fullscreen. Caption tracks supplied by the HLS manifest are available; automatic transcription is not enabled by this change.

The browser keeps upload capabilities in **sessionStorage**, scoped by signed-in user and a fingerprint containing file metadata plus a hash of its first 64 KiB. This supports same-tab retries/reselection for six hours; credentials are not printed to logs. Reloading does not retain the composer text or file selection: reselect the same file to resume. Closing the tab removes this cache. If browser storage is unavailable, the current upload still works but reload resumption is unavailable.

Cancel stops transfer/polling and prevents this submission; it deliberately does not delete the remote upload, allowing resumption. Unreceived reservations expire. Uploaded-but-unpublished videos can remain billable: periodically reconcile Stream creator uploads against persisted post media before deleting orphans. Never delete a UID solely because a browser tab was closed; it may already belong to a published post.

## Security and operational boundaries

- Upload creation requires a session and matching origin. Server-controlled duration, size, expiry, and creator prevent clients from changing those constraints.
- Creation has a bounded in-process allowance of ten new uploads per user per hour. This is a local guard, **not a global quota** across Cloud Run instances/restarts. Configure an edge/API rate limit or a shared durable quota before opening uploads to large/untrusted audiences; monitor Stream storage reservations and billing.
- These are public social-media playback URLs with hostname restrictions, matching the previous public-video model. Hostname restrictions are not viewer authorization. Private/paid media would require signed playback tokens plus backend audience checks before enabling that product behavior.
- Readiness is verified before normal composer publication. Existing backend post APIs still accept media metadata; they are not changed into a universal asset-ownership enforcement layer by this frontend migration.

## Verification

```bash
npm run test:stream
npm run test:uploads
npm run build
```

After deployment, sign in and upload a short MP4. Pause/resume, interrupt/reconnect the network, and verify processing completes before publication. Test a quote and a reply, then playback in a second browser. Confirm that an unauthenticated upload returns 401, another user cannot query its UID. Review network requests: tus traffic should go directly to Cloudflare; the account API token must never appear there. A live end-to-end Stream upload requires a configured, funded Stream account and has not been performed by the automated test suite.

References: [Cloudflare resumable uploads](https://developers.cloudflare.com/stream/uploading-videos/resumable-uploads/), [direct creator tus flow](https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/), [using your own player](https://developers.cloudflare.com/stream/viewing-videos/using-own-player/).
