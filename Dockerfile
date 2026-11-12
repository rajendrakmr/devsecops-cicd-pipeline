# Stage 1: Install production dependencies
FROM node:24-alpine AS deps

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force


# Stage 2: Production runtime
FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Copy only production dependencies
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Copy application source
COPY --chown=node:node package*.json ./
COPY --chown=node:node src ./src

# Run as non-root user
USER node

EXPOSE 3000

# Application health check
HEALTHCHECK --interval=30s \
            --timeout=3s \
            --start-period=10s \
            --retries=3 \
            CMD wget -q -O /dev/null http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]