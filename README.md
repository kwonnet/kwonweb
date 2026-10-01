This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# Set firebase cors to allow file download

```bash 

gsutil cors set ./src/firebase/cors.json gs://torazon.firebasestorage.app

```
## Google Cloud Run

The Dockerfile builds Next.js standalone output. The server listens on `0.0.0.0`
and honors Cloud Run's `PORT` (local image default: 3000).

### Environment variables are supplied at runtime

Set these on the **kwonweb Cloud Run service**, under Edit and deploy new revision
→ Variables & secrets:

- `NEXT_PUBLIC_API_URL`: public HTTPS kwonserver origin, **without a trailing slash or `/api/v1`**.
- `NEXT_PUBLIC_APP_URL`: public HTTPS kwonweb origin.
- `AUTH_URL`: the same frontend origin.
- `AUTH_TRUST_HOST=true`: trust the Cloud Run proxy.
- `AUTH_SECRET`: a stable random secret, preferably referenced from Secret Manager.

Configure public ImageKit, Bunny, Flutterwave, VAPID and advertising values needed
by enabled features there as well. `src/config/public-env.ts` lists the supported
public variables. The root layout renders dynamically and injects only those
allowlisted settings into HTML before hydration. Server code reads the same
runtime settings using dynamic environment lookup. No public Docker build
arguments are needed. Local `next dev` still reads Next.js dotenv files.

Only put browser-safe values in public variables. AUTH_SECRET, database passwords,
and Bunny private API/storage keys must never be added to the public allowlist.
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

Use `AUTH_URL=http://localhost:8080` and `NEXT_PUBLIC_APP_URL=http://localhost:8080`
for this local check. Supply all enabled feature configuration, including ImageKit.
Run regression checks with `node --test tests/public-env.test.cjs`.
Cloud Run deployment images must target `linux/amd64`; Cloud Build handles this.
