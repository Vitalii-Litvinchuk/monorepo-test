#!/bin/sh
set -e

DB_FILE="${DB_PATH:-/app/data/inventory.sqlite}"
UPLOADS="${UPLOADS_DIR:-/app/data/uploads}"
export JWT_SECRET="${JWT_SECRET:-dzencode-production-secret-jwt-key-2026}"

# Ensure parent directory of database and uploads exist
mkdir -p "$(dirname "$DB_FILE")" "$UPLOADS"

# Auto-seed SQLite database if not present or empty
if [ ! -f "$DB_FILE" ] || [ ! -s "$DB_FILE" ]; then
  echo "[Entrypoint] Database not found at $DB_FILE. Initializing seed data..."
  node apps/api/dist/database/seed.js || npm run seed || echo "[Entrypoint] Seed completed or handled."
fi

case "$1" in
  api)
    echo "[Entrypoint] Starting NestJS API service on port ${PORT:-4000}..."
    exec node apps/api/dist/main.js
    ;;
  web)
    echo "[Entrypoint] Starting Next.js Web service on port ${PORT:-3000} (basePath: ${NEXT_PUBLIC_BASE_PATH:-/test})..."
    exec npm run start --workspace=@dzencode/web
    ;;
  all|*)
    echo "[Entrypoint] Starting ALL-IN-ONE mode: NestJS API (:4000) + Next.js Web (:3000) at basePath ${NEXT_PUBLIC_BASE_PATH:-/test}..."
    # Start API in background
    PORT=4000 node apps/api/dist/main.js &
    API_PID=$!

    # Brief delay for API initialization
    sleep 2

    # Start Web in foreground
    PORT=3000 npm run start --workspace=@dzencode/web &
    WEB_PID=$!

    trap "kill -TERM $API_PID $WEB_PID" SIGINT SIGTERM
    wait $API_PID $WEB_PID
    ;;
esac
