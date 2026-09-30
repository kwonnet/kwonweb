# Stage 1: Install dependencies
FROM node:22-bookworm-slim AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package management files to optimize layer caching
COPY package.json package-lock.json* ynpm.lock* yarn.lock* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found. Installing with npm..." && npm i; \
  fi

# Stage 2: Build the application
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Comment the following line if you want to enable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  elif [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  else npm run build; \
  fi

# Stage 3: Production runner
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user and group for runtime security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets (standalone mode excludes public and static assets by default)
COPY --from=builder /app/public ./public

# Set the correct permissions for Next.js prerender cache and assets
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage standalone output to reduce image size
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

# Run the standalone Node.js server
CMD ["node", "server.js"]