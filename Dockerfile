FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN mkdir -p data public/uploads
ENV NODE_OPTIONS="--max-old-space-size=1024"

# NEXT_PUBLIC_ vars must be available at build time (Next.js inlines them)
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID=""
ARG NEXT_PUBLIC_SERVICE_CHARGE_PERCENT=5
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=${NEXT_PUBLIC_RAZORPAY_KEY_ID}
ENV NEXT_PUBLIC_SERVICE_CHARGE_PERCENT=${NEXT_PUBLIC_SERVICE_CHARGE_PERCENT}

RUN npm run build

ENV NODE_ENV=production
ENV DATABASE_URL=file:./data/givezy.db
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
