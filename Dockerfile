# ------------------------------------------------------------------------------
# Stage 1: Dependencies installation
# ------------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# Install build dependencies if needed (e.g. libc6-compat for alpine)
RUN apk add --no-cache libc6-compat

# Copy package manifests
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies required for building)
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 2: Application Builder
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables for client-side bundling
ARG VITE_SUPABASE_PROJECT_ID=rngrlnppxicovgqaysdt
ARG VITE_SUPABASE_URL=https://rngrlnppxicovgqaysdt.supabase.co
ARG VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_r3QQyufjmhgV6MMnesFF9A_lzLD0vMh

ENV VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}

# Instruct Nitro to build a standalone Node.js server
ENV NITRO_PRESET=node-server
ENV NODE_ENV=production

# Build both client bundle and Nitro SSR server
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Runner
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

ENV SUPABASE_URL=https://rngrlnppxicovgqaysdt.supabase.co
ENV SUPABASE_PUBLISHABLE_KEY=sb_publishable_r3QQyufjmhgV6MMnesFF9A_lzLD0vMh

# Run container as non-root user for security
USER node

# Copy only the compiled standalone Nitro server and public client assets
COPY --from=builder --chown=node:node /app/.output ./.output

EXPOSE 3000

# Health check to verify server is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

# Start the standalone Nitro server
CMD ["node", ".output/server/index.mjs"]
