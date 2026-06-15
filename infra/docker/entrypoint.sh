#!/bin/sh
set -e

echo "[Entrypoint] Running database migrations..."
node scripts/migrate.js || echo "[Entrypoint] Migration warning (non-fatal)"

echo "[Entrypoint] Starting BeautyIQ Revenue System..."
exec node dist/main.js
