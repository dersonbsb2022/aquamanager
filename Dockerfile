# Imagem única de produção: API (Node) + frontend (nginx), como aquarium-light-controller

FROM node:22-bookworm-slim AS api-builder
WORKDIR /app/api
COPY packages/api/package.json ./
RUN npm install
COPY packages/api/ ./
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS web-builder
WORKDIR /app/web
COPY packages/web/package.json ./
RUN npm install
COPY packages/web/ ./
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:22-bookworm-slim AS runner
RUN apt-get update \
  && apt-get install -y --no-install-recommends nginx curl \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /app/api/uploads /usr/share/nginx/html \
  && rm -f /etc/nginx/sites-enabled/default

WORKDIR /app/api
ENV NODE_ENV=production
ENV PORT=3333
ENV UPLOAD_DIR=/app/api/uploads

COPY packages/api/package.json ./
COPY packages/api/prisma ./prisma
RUN npm install --omit=dev && npm install prisma@^6.8.2 --no-save

COPY --from=api-builder /app/api/dist ./dist
COPY --from=api-builder /app/api/node_modules/.prisma ./node_modules/.prisma
COPY --from=api-builder /app/api/node_modules/@prisma ./node_modules/@prisma

COPY --from=web-builder /app/web/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=60s \
  CMD curl -fsS http://127.0.0.1/api/health || exit 1

CMD ["/start.sh"]
