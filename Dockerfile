# Built in CI and pulled by the droplet, which has 512 MB of memory and cannot
# compile Next.js without thrashing swap. Nothing here needs credentials, so the
# image can be built by anyone, anywhere.

# ---- build ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# The droplet's own limit; keep the build honest about what it needs
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm run build

# ---- run ----
FROM node:20-alpine AS runner
WORKDIR /app

# Alpine ships no zoneinfo, so TZ is silently ignored without this package.
# Pickup caps roll over and admin dates render in IST, not UTC.
RUN apk add --no-cache tzdata
ENV TZ=Asia/Kolkata

# Runtime dependencies only. drizzle-kit and tsx are listed as dependencies
# because the entrypoint runs migrations and seeds the admin before starting.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Only what the server actually reads at runtime
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY drizzle ./drizzle
COPY drizzle.config.ts ./
COPY src ./src
COPY tsconfig.json ./
COPY entrypoint.sh ./

RUN mkdir -p data public/uploads && chmod +x entrypoint.sh

ENV NODE_ENV=production
ENV DATABASE_URL=file:./data/givezy.db
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

CMD ["./entrypoint.sh"]
