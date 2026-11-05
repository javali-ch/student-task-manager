# ==========================================
# Stage 1: Install production dependencies
# ==========================================
FROM node:20-alpine AS dependencies

WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies cleanly
RUN npm ci --only=production --ignore-scripts || npm install --omit=dev --ignore-scripts

# ==========================================
# Stage 2: Production runtime environment
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Install curl/wget for container health checks
RUN apk add --no-cache wget

# Copy production node_modules from dependencies stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules

# Copy application source code
COPY . .

# Set ownership to unprivileged built-in 'node' user for security
RUN chown -R node:node /usr/src/app

# Switch to non-root user
USER node

# Expose API port
EXPOSE 5000

# Container Health Check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start Node.js server
CMD ["node", "server.js"]

