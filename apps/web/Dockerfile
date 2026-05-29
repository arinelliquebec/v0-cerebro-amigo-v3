# Build context = monorepo root

FROM node:22-alpine AS deps
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.33.3 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --ignore-scripts --filter "./apps/web..."

FROM node:22-alpine AS builder
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.33.3 --activate
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY apps/web ./apps/web
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Turbopack usa raiz do workspace para resolver o pacote `next`
RUN cd apps/web && node_modules/.bin/next build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=app:app /repo/apps/web/public ./apps/web/public
COPY --from=builder --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static

USER app
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "apps/web/server.js"]
