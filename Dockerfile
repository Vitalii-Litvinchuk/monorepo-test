# ==============================================================================
# Multi-Stage Dockerfile for dzencode Monorepo
# Image: advanceddocker/monorepo-test:tagname
# Supports subpath routing (/test) and all-in-one or separate service execution
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build packages and applications
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Base path for Next.js subpath routing (/test-web)
ARG BASE_PATH=/test-web
ENV NEXT_PUBLIC_BASE_PATH=$BASE_PATH
ENV NEXT_PUBLIC_API_URL=/test-api

# Copy dependency manifests and source files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

# Install ALL dependencies including workspace devDependencies (@nestjs/cli, tsc, turbo)
RUN npm install --include=dev

# Build shared contracts first, then backend NestJS API and frontend Next.js Web
RUN npm run build --workspace=@dzencode/contracts
RUN npm run build --workspace=@dzencode/api
RUN npm run build --workspace=@dzencode/web

# ------------------------------------------------------------------------------
# Stage 2: Production Runner
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PUBLIC_BASE_PATH=/test-web
ENV NEXT_PUBLIC_API_URL=https://server.lab.mooo.com/test-api
ENV FRONTEND_URL=https://server.lab.mooo.com/test-web
ENV API_BASE_PATH=/test-api
ENV API_INTERNAL_URL=http://localhost:4000
ENV DB_PATH=/app/data/inventory.sqlite
ENV UPLOADS_DIR=/app/data/uploads

RUN mkdir -p /app/data /app/data/uploads

COPY --from=builder /app ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Web on 3000, API on 4000
EXPOSE 3000 4000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["all"]
