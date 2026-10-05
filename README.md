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
