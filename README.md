This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Use Node.js 22.23.3 (see `.nvmrc`), install from the npm lockfile, then start:

```bash
nvm use
npm ci
npm run dev
```

Validate a change before deploying:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

See [dependency upgrade notes](docs/dependency-upgrade.md) for compatibility pins,
migration details, and remaining upstream advisories.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Continuous integration

[Kwonweb CI](.github/workflows/ci.yml) runs on every push (all branches and tags),
on pull requests, and manually from GitHub's **Actions** tab. It uses the Node
version in `.nvmrc`, caches npm downloads, installs with `npm ci`, and runs the
full test suite, TypeScript checks, lint, and a production build. A failing step
fails the check; existing lint warnings do not fail it.

No repository secrets or live services are required. The workflow validates
changes but does not deploy them. To require passing CI before merging, select
the **Tests and build** check in the branch's GitHub ruleset/branch protection.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Image storage

Post, quote and reply images use Cloudflare R2 through an authenticated Next.js
upload endpoint. See [R2 setup](docs/r2-uploads.md) for environment variables,
bucket configuration and upload limits.

## Guest homepage and authentication

Visitors can open `/` with the normal dashboard, Search, composer, sidebar and
the same newsfeed cards as signed-in users. Scrolling is allowed during the
preview. The centered authentication dialog opens after 30 seconds or the first
action, with login shown first and signup available as an alternative. It cannot
be dismissed with Escape or a backdrop click. Login
refreshes the server session and returns to the originally requested safe URL.
Other feeds, private pages, uploads and post actions still require authentication.

Deploy **kwonserver before kwonweb** for this feature: the frontend reads
`GET /api/v1/posts/preview` from the existing `NEXT_PUBLIC_API_URL`. No new
environment variables or database migrations are needed. The endpoint returns
at most 21 published public root posts from active public accounts. Posts from
the last 72 hours are ranked by likes, replies, reposts and shares; newer posts
break ties. Older posts fill any remaining spaces, newest first. It uses a small
field projection; private/restricted posts, polls, quizzes and personalized data
are excluded. It rechecks visibility on every request rather than sharing a
cached personalized feed. Guest videos do not autoplay and interactions require
login. Guest rendering does not send authenticated impressions, views or reactions.

## Google Cloud Run

The Dockerfile builds Next.js standalone output. The server listens on `0.0.0.0`
and honors Cloud Run's `PORT` (local image default: 3000).

### Environment variables are supplied at runtime

Set these on the **kwonweb Cloud Run service**, under Edit and deploy new revision
→ Variables & secrets:

- `NEXT_PUBLIC_API_URL`: public HTTPS kwonserver origin, **without a trailing slash or `/api/v1`**.
- `NEXT_PUBLIC_APP_URL`: public HTTPS kwonweb origin.
- `AUTH_TRUST_HOST=true`: trust the Cloud Run proxy.
- `AUTH_SECRET`: a stable random secret, preferably referenced from Secret Manager.

For the custom domain, set `NEXT_PUBLIC_APP_URL=https://kwonnet.com`.
Authentication derives its internal `AUTH_URL` from this setting automatically;
you do not need to configure `AUTH_URL` or `NEXTAUTH_URL` in Cloud Run.
Do not use Docker's `0.0.0.0:3000` listening address.
Login redirects use the configured public origin and a relative
callback path. The sign-in page rejects old internal-host or external callbacks
and returns to the current site's homepage instead.

Configure public Flutterwave, VAPID and advertising values needed
by enabled features there as well. `src/config/public-env.ts` lists the supported
public variables. The root layout renders dynamically and injects only those
allowlisted settings into HTML before hydration. Server code reads the same
runtime settings using dynamic environment lookup. No public Docker build
arguments are needed. Local `next dev` still reads Next.js dotenv files.

Only put browser-safe values in public variables. AUTH_SECRET, database passwords,
and Cloudflare API/storage credentials must never be added to the public allowlist.
Private environment variables remain server-side. `.env*` files are excluded
from Docker builds. Inline JSON escapes HTML delimiters to prevent script injection.

### Deploy this change

1. Commit and push the code; let your existing Cloud Build trigger build and deploy
   the Dockerfile. This fix needs one new image; changing variables on the old
   image alone does not fix its browser bundle.
2. Confirm the above variables are set on the serving Cloud Run revision. Preserve
   existing secrets and other feature settings.
3. Route traffic to the new revision and reload the page. Later environment-only
   updates need a new Cloud Run revision but do not require rebuilding the image.
4. In browser DevTools → Network, confirm API calls go to kwonserver's real HTTPS
   origin rather than an `undefined` or localhost URL. Configure kwonserver CORS
   to allow the exact frontend origin, with credentials where needed.
5. Sign in and inspect the feed response's `X-Feed-Source`: `kwonrec` confirms the
   backend used recommendations; `fallback` requires checking the backend-to-VM
   connection. The browser must not connect directly to kwonrec's private IP.

If the service shows Google's placeholder, check Cloud Build history and the
image/traffic under Cloud Run revisions: a healthy placeholder is not this app.

### Local container verification

Build with no environment arguments:

```sh
docker build -t kwonweb:latest .
```

Run with a runtime-only environment file (Docker CLI env files require unquoted
values). Keep this file untracked and private:

```sh
docker run --rm --env-file .env.docker -e PORT=8080 -p 8080:8080 kwonweb:latest
```

Use `NEXT_PUBLIC_APP_URL=http://localhost:8080`
for this local check. Supply all enabled feature configuration, including the
server-only Cloudflare R2 and Stream settings documented in `docs/`.
Run regression checks with `npm test`.
Cloud Run deployment images must target `linux/amd64`; Cloud Build handles this.

### Logout and multiple accounts

The account menu lists real accounts saved on this device, with a maximum of five.
“Add another account” opens a login form; selecting a saved account starts a fresh
verified session and reloads the page to clear the previous account's private data
and sockets. Expired saved API credentials require logging in again.

Saved account credentials are encrypted using `AUTH_SECRET` in HttpOnly cookies;
passwords are never saved. Signing out clears current and legacy session cookies,
invalidates late session refreshes, and removes the current saved account. Other
saved accounts remain available after an explicit login; logout does not select
another account automatically. Keep `NEXT_PUBLIC_APP_URL` set to the actual public
origin. No new environment variables or database migration are required.

Deploy kwonserver first (bearer identity priority and `/auth/logout`), then kwonweb.

### Profile feed loading and read caches

The profile route streams its authorized active tab's first page from the server.
Each tab caches pages by viewer, profile, kind, and page in SWR, renders cached
content on return, and revalidates in the background. Newly streamed pages skip a
duplicate browser request. Load-more prefetches 800 px ahead and only requests one
page at a time. Quote/share drawers load when opened, and inactive feed tab bundles
load on demand. Empty API pages become empty arrays; errors remain errors.

The shared SWR provider deduplicates reads for 30 seconds and throttles repeated
focus revalidation. Existing explicit mutation, reconnect and realtime updates
remain active. Sensitive wallet/session reads are not persistently cached on the
server. Public catalogs use the API's bounded cache described in kwonserver's README.

### Google sign-in

Set server-only `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in the web runtime, and
set the same `AUTH_GOOGLE_ID` in kwonserver's deployment environment. Use a Google
OAuth **Web application** client with authorized redirect URIs:

- Production: `https://kwonnet.com/api/auth/callback/google`
- Local development: `http://localhost:3000/api/auth/callback/google`

Register each staging/dev hostname separately and keep `AUTH_URL` aligned with the
web app's public origin. Do not prefix these credentials with `NEXT_PUBLIC_`.
The Continue with Google button appears when both web credentials are configured.
Deploy the API migration before the web changes. Google callbacks exchange the
verified Google ID token for the normal Kwonnet API identity and access token;
logout, identity generations and saved-account switching use the same flow as
password authentication. No Google refresh token is stored.

### Post Gifters

Post engagements adds an owner-only Gifters tab. Its private API rejects visitors
and returns paginated gifts plus total gross coins gifted. Anonymous senders are
not exposed, even to the owner. Refunded/expired gifts are excluded. Amounts are
returned as decimal strings and wallet settlement rules remain separate.
Historical tips without a captured coin amount are explicitly labeled estimates.

### Public legal pages

`/privacy-policy` and `/terms-of-service` are server-rendered legal pages outside
the dashboard's guest authentication gate. They use Kwonnet and
`support@kwonnet.com` as the operator/contact details. The proxy marks only these
exact routes as public; their root rendering skips authentication refresh and
realtime/device providers so missing or invalid sessions cannot block reading.
Client-supplied copies of that internal marker are stripped on other routes.
Homepage/sidebar and authentication-form links point to these pages, and guests
can activate the legal links without triggering the login prompt. Other actions
retain the existing guest authentication behavior.

### Authentication security lifecycle

Password/Google signin forwards signed browser metadata through the existing API
auth endpoints when `AUTH_TELEMETRY_SHARED_SECRET` (32+ chars) matches the backend.
No cookies, credentials, or tokens are included in that metadata envelope. User
agent/IP are transient inputs; the API retains only parsed device fields, masked
IP/optional keyed hash and sanitized approximate-location JSON. Optional
`AUTH_TRUSTED_WEB_IP_HEADER` must be overwritten by trusted ingress with origin
bypass blocked; no browser IP is accepted from arbitrary forwarding headers by
default. Missing configuration yields nullable browser location, not a fabricated
address. Keep this secret server-only and synchronize clocks (signature window 60s).

API session IDs survive refresh. Saved-account switches request a new tracked
session with the original provider attribution. SessionProvider polls each minute;
tracked polling validates revocation through `/auth/session-status` before exposing
the session. The boundary discards the private React tree and reloads guest home
when authentication is lost; public legal pages remain readable. Logout attempts
server revocation before clearing cookies, without refreshing the old identity.
`serverRevoked:false` reports API outage even though local logout completes.

SSE connects to the same-origin `/api/events` route, which authenticates the local
session and forwards the API bearer server-side. No API token is placed in the SSE
URL. Backend streams and sockets enforce revocation with an idle recheck interval
of up to 30 seconds. Existing in-flight authorized operations can still finish.
The backend exposes owned session/history/revocation APIs; a dedicated settings
screen for managing that history is not part of this change.

Deploy the backend migration/API first, then the web runtime. See kwonserver's
README for proxy trust, independent IP-hash salt, legacy-token compatibility and
the `auth:cleanup` maintenance command/scheduling step.


Settings now lists the signed-in user's active sessions with pagination and revoke
controls. Push enable/disable applies to the current browser; existing subscriptions
are synchronized to the selected account without asking for permission automatically.
The browser subscription is removed on logout/session loss. Use matching public VAPID
keys with kwonserver and test a notification after deploying the server migration and
restarting its background worker.


### Page metadata and account settings

Every page defines `metadata` or `generateMetadata` using Next.js server exports.
`src/lib/seo.ts` supplies canonical URLs, descriptions, Open Graph/Twitter cards,
and robots directives; `src/lib/seo-data.ts` fetches public-only dynamic metadata
without credentials. `NEXT_PUBLIC_APP_URL` must be the production HTTPS origin.
The root title template applies Kwonnet branding consistently. Search and all
login-protected/private pages are noindex. Public root post detail pages render a
public-only preview for guests and are crawlable; the existing guest authentication
prompt still guards actions. Embeds canonicalize to their full post detail URL.
Profiles remain behind the existing login flow and are noindex, even when their
safe public profile fields are used for signed-in page metadata.

`/robots.txt` and `/sitemap.xml` bypass login. The sitemap currently includes only the homepage and legal pages. Submit `/sitemap.xml` in your search engine
console after deployment. Draft, hidden, restricted, deleted and private-author
posts are excluded. SEO metadata fetches time out safely rather than failing pages.
Deploy kwonserver and its migration before kwonweb so public previews use the new
visibility checks. A password change signs out other tracked/legacy sessions.

### Engagement Tasks and community reach

The authenticated `/tasks` route is available in the main navigation. It uses the
existing MUI styling, auth hook, notifications provider and SWR, with API calls in
`src/lib/tasks/index.ts`. The page fetches initial progress on the server using the
request's authenticated session and passes it to SWR as fallback data. Fallbacks
are scoped to the same user, and failed server requests can retry in the browser.
Task cards fill the dashboard width in a responsive grid (one column on phones,
two on tablets, three on wide screens). Progress is refreshed on focus and every minute. Each task
shows its target, capped progress, daily bonus and individual 24-hour cooldown. A
check attempts a server-verified claim; incomplete checks show remaining progress.
The browser retains a wallet intent ID for safe retries and revalidates the current
wallet after a successful reward. Admin/Super users can disable tasks or change the
required count in the same page; the API enforces the role independently.

Feed cards identify injected community slots without changing organic ordering.
Post-owner Analytics shows the 24-hour boost target, qualified impressions and
expiry. Impressions require half the card visible for one second in a visible tab;
authenticated keepalive fetches use headers so tokens never appear in logging URLs.
Guests do not mint rewards or boost impressions. Organic repeats remain possible;
boosted inserts are suppressed for the same authenticated viewer across all five
feed tabs. Do not edit the separate existing game/ad bonus page to configure these
tasks. Deploy kwonserver's migration and worker before deploying this UI.

See kwonserver README → “Engagement rewards, community boosts and welcome-email
delivery” for the defaults, eligibility definition, API responses, concurrency,
SMTP variables, target limits, rollout behavior and operational recovery.

### New-post availability button

Each authenticated home feed opens a feed-scoped SSE stream through `/api/events`
using `useAvailableNewsfeed`. Every one minute while the page is visible, the
API checks for a bounded snapshot of new eligible IDs and minimal author previews. A sticky floating button displays
the unseen count (up to 50+) with a horizontal MUI AvatarGroup for the latest three
distinct pending authors. Already displayed or consumed posts are excluded. For
You compares personalized ranked recommendations with the user’s delivered-post
history; no generic fallback notifications are pushed. Hidden pages close the
stream and resume with their latest seen baseline when visible. Multiple visible
tabs keep separate SSE connections but reuse a per-user Redis ranking snapshot;
only its lease owner triggers inference in each one-minute window. Each tab still
filters its own displayed posts. Optional For You notifications pause if Redis
coordination is unavailable, while ordinary feed loading remains functional.
Clicking loads those exact posts, prepends them to SWR's first page, preserves loaded
pages, and scrolls to the feed start. It does not automatically jump or clear cards
while reading. Failures retain the pending snapshot for retry. Tab/account changes
close the old stream, remount viewer-scoped feed state, and discard stale responses.
Existing reaction streams, load-more behavior and server-loaded fallback data remain
in use. Search/profile pages and guests do not use this feature. See the server
README's “Available newsfeed snapshots over SSE” for API and operational details.

### Idle-session recovery

Session polling refreshes expiring access tokens before verifying server session
status. Transient API/network failures preserve the local session; confirmed
revocation still clears it. Account-generation and explicit-logout protections remain
in place, including concurrent tabs. API authorization remains server enforced;
keeping a browser session during an outage does not grant access to protected data.
The new-post floating button uses concise singular/plural labels (“1 post”, “2 posts”)
and retains the author AvatarGroup.

### Game reconnects and interrupted SSE responses

Room-page rejoin emits the same `{roomId, mode}` contract as initial room selection.
A successful rejoin updates joined state and keeps the player in the game page.
Game socket connect/disconnect events reset joined state so the active page can
rejoin after network reconnection or token refresh.

The `/api/events` proxy owns reads of the upstream SSE body. An upstream socket
termination becomes clean EOF, allowing browser EventSource reconnection, rather
than escaping as Next.js “failed to pipe response”. Downstream cancellation aborts
the upstream request and releases listeners. This handles interrupted streams; it
does not make upstream outages or deployment interruptions impossible.

### Stable socket sessions

`SocketIoContext` creates sockets per account/tracked-session identity, rather than
per access-token value. Renewing the token does not close live game/conversation
connections; authentication callbacks read the latest token on future handshakes.
Changing accounts, starting a different tracked session or logout retires the old
connections. The SSE proxy additionally logs unexpected upstream interruptions
without logging credentials or treating normal cancellation as an upstream error.

### Profile identity synchronization

Profile editor saves (including avatar/banner uploads) and settings username saves
use `useRefreshProfileIdentity`. After the API commits the change, it forces a
NextAuth update and verifies the returned account ID, public identity and country
against the saved profile. A preserved old session during a backend outage is
reported as a refresh failure instead of being saved over the updated identity.
Only backend-returned country data drives the store/subscription currency selection.

The refreshed session updates all `useAuthSession` consumers. Public identity fields
are patched into matching SWR records, preserving other authors, reactions and
private fields. Saved-account cookies are remembered again and account-list caches
are revalidated for both profile and settings saves. Account GET also overlays the
active authenticated identity on older saved-cookie metadata, so profile links use
the current username. NextAuth broadcasts the update to other tabs; the existing app
provider synchronizes their cached records and refreshes server-rendered content
when identity/country changes. Routine token renewal does not sweep caches or
refresh layouts. No new database migration is required.

### Search-engine discovery and sitemap publishing

`/sitemap.xml` is the public sitemap index. For now it lists only
`/sitemaps/static/sitemap.xml`, containing `/`, `/privacy-policy` and
`/terms-of-service`. Both sitemap routes and robots.txt bypass login and require
no API, database or session lookup. robots.txt advertises `/sitemap.xml`.

Dynamic post sitemaps are temporarily disabled in kwonweb only. Previously
advertised `/sitemaps/posts/<page>.xml` routes return 404 without fetching posts.
The backend inventory endpoints and XML/API helpers remain available for future
re-enablement. To restore post inventory, restore the root route's count lookup
and the post-shard route's validated page lookup, then update the route tests.
Protected pages remain excluded; public post metadata is unchanged by this pause.

The homepage includes WebSite/Organization JSON-LD. Public post pages already have
canonical, Open Graph and Twitter metadata; private account pages retain noindex.
Set NEXT_PUBLIC_APP_URL=https://kwonnet.com in production. Optional server runtime
variables GOOGLE_SITE_VERIFICATION and BING_SITE_VERIFICATION emit ownership meta
tags; copy only the verification token from each search-console account, not OAuth
credentials. No verification token is required when ownership is verified by DNS.

Deploy kwonweb only for this static-only change. No backend deployment or database migration is required. Verify
public 200 XML responses from `/sitemap.xml` and its child URLs, then submit
`https://kwonnet.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
Use their URL inspection tools on the homepage and check subsequent crawl errors.
A sitemap aids discovery; indexing/ranking is decided by the search engine and
cannot be guaranteed. Reference: [Google's sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

Sitemap tests cover static inventory, robots discovery, availability without the
API, and disabled post shards making no post requests. Retained XML and public API
helpers are tested for future re-enablement.
