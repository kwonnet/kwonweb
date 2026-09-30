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

The Dockerfile builds Next.js standalone output and packages only the production server, traced dependencies, static assets, and public files. It runs as a non-root user, listens on `0.0.0.0`, and honors Cloud Run's `PORT` (default `8080`). `/api/health` is an unauthenticated liveness endpoint. Authentication trusts the Cloud Run proxy via `AUTH_TRUST_HOST=true`.

### Build configuration

`NEXT_PUBLIC_*` values are embedded in browser bundles at **build time**. Setting them only in Cloud Run runtime environment variables will not configure the browser. Supply `NEXT_PUBLIC_API_URL` (kwonserver origin, without `/api/v1`) and `NEXT_PUBLIC_APP_URL` (public frontend origin). Both are required. Supply the additional public ImageKit, Bunny, Flutterwave, VAPID, and advertising settings used by enabled features through the corresponding Docker build arguments listed in `Dockerfile`.

Local build and smoke test:

```sh
docker build -t kwonweb:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_APP_URL=https://web.example.com \
  --build-arg NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/YOUR_ID \
  --build-arg NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=YOUR_PUBLIC_KEY .

# Set AUTH_SECRET in your shell; Docker forwards it without putting it in the image.
docker run --rm -p 8080:8080 -e AUTH_SECRET \
  -e AUTH_URL=http://localhost:8080 kwonweb:latest
# In another terminal: curl --fail http://localhost:8080/api/health
```

Use your real public configuration when building for deployment. Cloud Run requires `linux/amd64`; on Apple Silicon use `docker buildx build --platform linux/amd64 --push ...` when building deployment images yourself. Cloud Build builds on the supported architecture.

### Build and deploy in Google Cloud

Create a Docker Artifact Registry repository named `kwonnet` (or set `_REPOSITORY` to an existing one). Configure the substitutions in `cloudbuild.yaml` or in your Cloud Build trigger, including all public settings your deployment uses. The configuration contains no private credentials. Submit from this directory:

```sh
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=europe-west1,_REPOSITORY=kwonnet,_NEXT_PUBLIC_API_URL=https://api.example.com,_NEXT_PUBLIC_APP_URL=https://web.example.com,_NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/YOUR_ID,_NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

The pipeline builds, explicitly pushes `europe-west1-docker.pkg.dev/PROJECT_ID/kwonnet/kwonweb:BUILD_ID`, deploys it to `_SERVICE` (default `kwonweb`), and sends traffic to the latest revision. It preserves existing runtime environment variables, secrets, and access settings. For first-time setup or a manual deployment with secret configuration:

```sh
gcloud run deploy kwonweb \
  --image europe-west1-docker.pkg.dev/PROJECT_ID/kwonnet/kwonweb:BUILD_ID \
  --region europe-west1 --port 8080 --allow-unauthenticated \
  --set-env-vars AUTH_URL=https://web.example.com \
  --set-secrets AUTH_SECRET=kwonweb-auth-secret:latest
```

Create the referenced Secret Manager secret and grant the Cloud Run runtime service account access first. Inject any enabled Bunny server-side keys through Secret Manager too; use the exact variable names in `src/config/bunny.ts`. `.env*` files are excluded from the image. Do not pass private credentials as build arguments or `NEXT_PUBLIC_*` variables.

If using a push-triggered deployment, configure the trigger to use `cloudbuild.yaml` and its public substitutions; an automatic Docker build with no arguments cannot infer your frontend/API URLs from Cloud Run runtime settings. Ensure kwonserver's CORS configuration allows your deployed frontend origin and that its API is reachable by browsers. The existing Firebase workflows are separate and are not changed by this configuration.


### If Cloud Run displays the placeholder page

`placeholder-1` and “Hello from Cloud Run!” in service logs indicate Google's placeholder container is serving requests. A successful startup probe for that container does not verify your Next.js build. Check **Cloud Build → History**, not just Cloud Run service logs.

Configure the repository trigger to use this `cloudbuild.yaml` (relative to the repository root) and the intended branch. It requires public URL substitutions, an existing Artifact Registry repository in `_REGION`, and a build service account with Artifact Registry Writer, Cloud Run deployment permissions, Service Account User on the runtime identity, and Logging Writer for Cloud Logging. Configure runtime `AUTH_SECRET` and `AUTH_URL` on the service before running the trigger. Keep secret values out of build substitutions.

After pushing the changes and running the trigger, all four steps must pass: build, push, deploy, and traffic update. In Cloud Run → kwonweb → Revisions, the serving image should reference your Artifact Registry image with the build ID, not the placeholder. If your repository root contains multiple projects, configure the build steps' working directory/build context for `kwonweb`; simply choosing a nested config file does not change the checkout working directory.
