
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy and install frontend dependencies
COPY package*.json ./
RUN npm ci

# Copy frontend source and build
COPY . .
RUN npm run build

# Copy and install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Copy server code and dependencies
COPY --from=builder /app/server ./server

# Copy server source files
COPY server/ ./server/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

EXPOSE 3001

# Start the server
CMD ["node", "server/index.js"]
