#!/bin/sh
set -e

cd "$(dirname "$0")/.."

echo "=== Migrations via container Docker (recomendado na VPS) ==="
docker compose -f docker-compose.vps.yml exec dhe-api ./node_modules/.bin/prisma migrate deploy

echo ""
echo "=== Status das migrations ==="
docker compose -f docker-compose.vps.yml exec dhe-api ./node_modules/.bin/prisma migrate status
