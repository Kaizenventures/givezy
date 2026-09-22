# Built in CI and pulled by the droplet, which has 512 MB of memory and a 10 GB
# disk and cannot compile Next.js without thrashing swap. Nothing here needs
# credentials, so the image can be built by anyone, anywhere.

# ---- build ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Next touches the database client while collecting route data, so the directory
# has to exist even though the real database lives on a volume at runtime
RUN mkdir -p data public/uploads
# The droplet's own limit; keep the build honest about what it needs
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm run build

# ---- migration tooling ----
# Installed separately rather than into the app's node_modules: the standalone
# bundle is traced from the server's imports, and an npm install inside it could
# prune something the server needs. drizzle-orm is here too because drizzle-kit
# resolves both it and the SQLite driver relative to itself, not to the app.
FROM node:20-alpine AS tools
WORKDIR /tools
RUN npm init -y > /dev/null \
    # No --omit=optional: @libsql/client ships its native bindings as optional
    # platform dependencies, and without them drizzle-kit reports it as missing
    && npm install --no-package-lock drizzle-kit@^0.31.9 drizzle-orm@^0.45.1 @libsql/client@^0.17.0 bcryptjs@^3.0.3 tsx@^4.21.0 \
    && npm cache clean --force

# ---- run ----
FROM node:20-alpine AS runner
WORKDIR /app

# Alpine ships no zoneinfo, so TZ is silently ignored without this package.
# Pickup caps roll over and admin dates render in IST, not UTC.
RUN apk add --no-cache tzdata
ENV TZ=Asia/Kolkata

# Standalone carries its own minimal node_modules and server.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Needed by the entrypoint before the server starts
COPY --from=tools /tools/node_modules /opt/tools/node_modules

# Next traces only the files the server itself imports, which leaves these
# packages incomplete for a separate process: the seed resolves
# drizzle-orm/libsql and fails on a subpath tracing never copied. Complete
# copies are a superset, so the server is unaffected.
COPY --from=tools /tools/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=tools /tools/node_modules/@libsql ./node_modules/@libsql
COPY --from=tools /tools/node_modules/bcryptjs ./node_modules/bcryptjs
COPY drizzle ./drizzle
COPY drizzle.config.ts tsconfig.json ./
COPY src ./src
COPY entrypoint.sh ./

RUN mkdir -p data public/uploads && chmod +x entrypoint.sh

ENV NODE_ENV=production
ENV DATABASE_URL=file:./data/givezy.db
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

CMD ["./entrypoint.sh"]
