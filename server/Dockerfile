# ── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: final image ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup -S campusgroup && adduser -S campususer -G campusgroup

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create logs directory with correct ownership
RUN mkdir -p logs && chown -R campususer:campusgroup /app

USER campususer

EXPOSE 5000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/ || exit 1

CMD ["node", "index.js"]
