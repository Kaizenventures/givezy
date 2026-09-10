FROM node:20-alpine
WORKDIR /app

# Alpine ships no zoneinfo, so TZ is silently ignored without this package.
# Caps roll over and admin dates render in IST, not UTC.
RUN apk add --no-cache tzdata
ENV TZ=Asia/Kolkata

COPY package.json package-lock.json ./
# Clear npm's download cache in the same layer, otherwise ~/.npm/_cacache is
# baked into the image and never used again at runtime.
RUN npm ci && npm cache clean --force

COPY . .
RUN mkdir -p data public/uploads
ENV NODE_OPTIONS="--max-old-space-size=1024"

# NEXT_PUBLIC_ vars must be available at build time (Next.js inlines them)
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID=""
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=${NEXT_PUBLIC_RAZORPAY_KEY_ID}

# .next/cache is build-only. Dropping it in the same layer keeps it out of the
# image entirely, rather than adding a layer that merely hides it.
RUN npm run build && rm -rf .next/cache

ENV NODE_ENV=production
ENV DATABASE_URL=file:./data/givezy.db
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
