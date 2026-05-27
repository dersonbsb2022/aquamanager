FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY prisma ./prisma
COPY tsconfig.json vitest.config.ts ./
COPY src ./src
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY prisma ./prisma
RUN npm install --omit=dev && npm install prisma@^6.8.2 --no-save
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
RUN mkdir -p uploads
ENV UPLOAD_DIR=/app/uploads
EXPOSE 3333
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
