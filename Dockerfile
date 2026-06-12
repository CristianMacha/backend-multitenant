# ---------- Base ----------
FROM node:22-alpine AS base
RUN corepack enable pnpm
WORKDIR /app

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm config set minimum-release-age 0 && pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm prisma generate

# ---------- Build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm config set minimum-release-age 0 && pnpm config set verify-deps-before-run false
RUN pnpm prisma generate
RUN pnpm build
RUN pnpm prune --prod --ignore-scripts

# ---------- Production ----------
FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health/live || exit 1

CMD ["node", "dist/src/main"]
