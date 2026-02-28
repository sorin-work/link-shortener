# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server/drizzle ./server/drizzle
RUN mkdir -p /data && chown node:node /data
ENV PORT=3000 \
    DATABASE_PATH=/data/links.db
USER node
EXPOSE 3000
VOLUME ["/data"]
CMD ["node", "dist/server/index.js"]
