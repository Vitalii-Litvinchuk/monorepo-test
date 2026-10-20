# ==============================================================================
# Ultra-Fast Multi-Arch Dockerfile for dzencode Monorepo
# Zero QEMU emulation during build via --platform=$BUILDPLATFORM
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Native Dependency Installation & Build (Runs 100% natively on host CPU)
# ------------------------------------------------------------------------------
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

WORKDIR /app

# 1. Copy only package manifests first to maximize Docker layer caching
COPY package*.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# 2. Install all dependencies natively (cached unless package.json changes)
RUN npm install --include=dev --prefer-offline --no-audit --no-fund

# 3. Copy source code
COPY tsconfig.base.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

# 4. Configure relative paths for Nginx reverse proxy (/test-web & /test-api)
ARG BASE_PATH=/test-web
ARG API_URL=/test-api
ENV NEXT_PUBLIC_BASE_PATH=$BASE_PATH
ENV NEXT_PUBLIC_API_URL=$API_URL
ENV NEXT_PUBLIC_WS_PATH=${API_URL}/socket.io

# 5. Build all workspaces natively on host CPU and remove 600MB+ of build caches & devDeps
RUN npm run build --workspace=@dzencode/contracts && \
    npm run build --workspace=@dzencode/api && \
    npm run build --workspace=@dzencode/web && \
    rm -rf apps/web/.next/cache && \
    npm prune --omit=dev

# ------------------------------------------------------------------------------
# Stage 2: Native Target-Arch Binary Prep (Still runs 100% natively on host CPU)
# ------------------------------------------------------------------------------
FROM --platform=$BUILDPLATFORM builder AS arch-prep

ARG TARGETARCH

# Fetch prebuilt sqlite3 N-API binary for target architecture in ~0.5s (no C++ compilation!)
RUN if [ "$TARGETARCH" = "arm64" ]; then \
      cd node_modules/sqlite3 && node ../prebuild-install/bin.js -r napi --arch=arm64 --platform=linux --libc=musl --force; \
    elif [ "$TARGETARCH" = "amd64" ]; then \
      cd node_modules/sqlite3 && node ../prebuild-install/bin.js -r napi --arch=x64 --platform=linux --libc=musl --force; \
    fi

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    mkdir -p /app/data/uploads && \
    cp -r apps/web/public/static/* /app/data/uploads/ 2>/dev/null || true

# ------------------------------------------------------------------------------
# Stage 3: Production Runner (Zero RUN instructions = Zero QEMU emulation!)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PUBLIC_BASE_PATH=/test-web
ENV NEXT_PUBLIC_API_URL=/test-api
ENV NEXT_PUBLIC_WS_PATH=/test-api/socket.io
ENV API_BASE_PATH=/test-api
ENV FRONTEND_URL=/test-web
ENV API_INTERNAL_URL=http://localhost:4000
ENV DB_PATH=/app/data/inventory.sqlite
ENV UPLOADS_DIR=/app/data/uploads

COPY --from=arch-prep /usr/local/bin/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY --from=arch-prep /app ./

EXPOSE 3000 4000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["all"]
