# ==============================================================================
# Multi-Stage Dockerfile for dzencode Monorepo
# Image: advanceddocker/monorepo-test:tagname
# Supports subpath routing (/test) and all-in-one or separate service execution
# ==============================================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Base path for Next.js subpath routing (/test)
ARG BASE_PATH=/test
ENV NEXT_PUBLIC_BASE_PATH=$BASE_PATH
ENV NODE_ENV=production

# Copy root monorepo files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

# Install all dependencies (production + build devDependencies)
RUN npm install

# Build shared contracts, backend API and frontend Web
RUN npm run build --workspace=@dzencode/contracts
RUN npm run build --workspace=@dzencode/api
RUN npm run build --workspace=@dzencode/web

# ==============================================================================
# Production Runner Stage
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PUBLIC_BASE_PATH=/test
ENV FRONTEND_URL=http://localhost:3000/test
ENV API_INTERNAL_URL=http://localhost:4000
ENV DB_PATH=/app/inventory.sqlite
ENV UPLOADS_DIR=/app/uploads
ENV JWT_SECRET=dzencode-super-secret-jwt-key-2026

COPY --from=builder /app ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Web on 3000, API on 4000
EXPOSE 3000 4000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["all"]
