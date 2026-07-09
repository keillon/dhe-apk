#!/bin/sh
# APAGA o banco e recria do zero. Use só se vps-fix-db-password.sh não resolver.
# Uso: ./scripts/vps-reset-db.sh

set -e

cd "$(dirname "$0")/.."

echo "ATENÇÃO: isso apaga todos os dados do banco DHE!"
sleep 3

docker compose -f docker-compose.vps.yml down -v

echo "Confirme que .env tem:"
echo "  DHE_DB_PASSWORD=dhe-apk"
echo ""

docker compose -f docker-compose.vps.yml up -d --build --wait
docker compose -f docker-compose.vps.yml exec dhe-api npx tsx prisma/seed.ts

curl -fsS http://127.0.0.1:8090/health && echo ""
echo "Banco recriado e seed aplicado."
