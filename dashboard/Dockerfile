# Stage 1: Builder — construit le dashboard ET le binaire MCP
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
RUN npm run build:mcp

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUDGET_PATH=/app/data/budget.json

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Le serveur MCP stdio, pour un lancement via `docker compose run --rm -T app node dist/mcp-server.mjs`
COPY --from=builder /app/dist ./dist

# data/ is bind-mounted at runtime — DO NOT COPY

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
