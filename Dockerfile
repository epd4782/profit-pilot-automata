
# Multi-stage build for production
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package*.json ./
RUN npm ci

# Copy frontend source code
COPY . .

# Build the frontend application
RUN npm run build

# Backend stage
FROM node:18-alpine AS backend-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built frontend assets
COPY --from=frontend-builder /app/dist ./dist

# Copy server code and dependencies
COPY --from=backend-builder /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

EXPOSE 3001

# Start the server
CMD ["node", "server/index.js"]
