# Stepwise — one container: Fastify API (TypeScript via tsx) + the built React app (same origin).
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/api-client/package.json packages/api-client/
COPY packages/engine/package.json packages/engine/
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build -w @stepwise/web

FROM node:20-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/api-client/package.json packages/api-client/
COPY packages/engine/package.json packages/engine/
RUN npm ci --omit=dev --workspace @stepwise/api --include-workspace-root --no-audit --no-fund

FROM node:20-slim AS runtime
ENV NODE_ENV=production PORT=8080 WEB_DIST=/app/apps/web/dist NODE_OPTIONS=--max-old-space-size=384
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./
COPY apps/api/package.json apps/api/
COPY apps/api/src apps/api/src
COPY apps/api/scripts apps/api/scripts
COPY apps/api/drizzle apps/api/drizzle
COPY apps/api/tsconfig.json apps/api/
COPY tsconfig.base.json ./
COPY packages ./packages
COPY --from=build /app/apps/web/dist ./apps/web/dist
RUN rm -rf packages/*/test && chown -R node:node /app
USER node
EXPOSE 8080
WORKDIR /app/apps/api
CMD ["node", "--import", "tsx", "src/server.ts"]
