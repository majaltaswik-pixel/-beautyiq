FROM node:20-alpine AS backend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm prune --production

FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache wget
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 beautyiq

COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package.json ./
COPY --from=backend-builder /app/prompts ./prompts
COPY --from=backend-builder /app/infra/migrations ./infra/migrations
COPY --from=backend-builder /app/scripts ./scripts
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY frontend/landing.html ./frontend/landing.html
COPY infra/docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

USER beautyiq

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
