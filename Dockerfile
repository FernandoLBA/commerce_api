FROM node:22.23.2-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./prisma.config.ts

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm exec prisma generate

RUN pnpm run build

FROM node:22.23.2-alpine AS production

WORKDIR /app

RUN apk add --no-cache dumb-init openssl
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile --prod

RUN pnpm exec prisma generate

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
--start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

ENTRYPOINT [ "dumb-init", "--" ]
CMD ["node", "dist/src/main.js"]