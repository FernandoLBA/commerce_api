FROM node:25.5-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

FROM node:25.5-alpine AS production

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json ./
COPY ./prisma/ ./prisma/

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

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