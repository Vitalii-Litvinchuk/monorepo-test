#!/bin/sh
set -e

DB_FILE="${DB_PATH:-/app/data/inventory.sqlite}"
UPLOADS="${UPLOADS_DIR:-/app/data/uploads}"
export JWT_SECRET="${JWT_SECRET:-dzencode-production-secret-jwt-key-2026}"

# Ensure parent directory of database and uploads exist
mkdir -p "$(dirname "$DB_FILE")" "$UPLOADS"

# Copy default static seed images into mounted uploads volume if missing
if [ -d "/app/apps/web/public/static" ]; then
  cp -rn /app/apps/web/public/static/* "$UPLOADS/" 2>/dev/null || true
fi

# Auto-seed SQLite database if not present or empty
if [ ! -f "$DB_FILE" ] || [ ! -s "$DB_FILE" ]; then
  echo "[Entrypoint] Database not found at $DB_FILE. Initializing seed data..."
  node apps/api/dist/database/seed.js || echo "[Entrypoint] Seed handled by API startup."
fi

case "$1" in
  api)
    echo "[Entrypoint] Starting NestJS API service on port ${PORT:-4000}..."
    exec node apps/api/dist/main.js
    ;;
  web)
    echo "[Entrypoint] Starting Next.js Web service on port ${PORT:-3000} (basePath: ${NEXT_PUBLIC_BASE_PATH:-/test-web})..."
    exec npm run start --workspace=@dzencode/web
    ;;
  all|*)
    echo "[Entrypoint] Starting ALL-IN-ONE mode: NestJS API (:4000) + Next.js Web (:3000)..."
    PORT=4000 node apps/api/dist/main.js &
    API_PID=$!

    sleep 2

    PORT=3000 npm run start --workspace=@dzencode/web &
    WEB_PID=$!

    trap "kill -TERM $API_PID $WEB_PID" SIGINT SIGTERM
    wait $API_PID $WEB_PID
    ;;
esac
