FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN mkdir -p data public/uploads
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm run build

ENV NODE_ENV=production
ENV DATABASE_URL=file:./data/givezy.db
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
