FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch
RUN pnpm install -r --offline
COPY . .
RUN pnpm build

FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY .env /app/.env

ARG PORT_FROM_ENV=3000
ENV PORT=${PORT_FROM_ENV}

EXPOSE ${PORT}

ENV NODE_ENV=production

CMD ["pnpm", "start"]