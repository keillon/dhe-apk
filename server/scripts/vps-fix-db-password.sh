#!/bin/sh
# Corrige senha do usuário dhe_app no Postgres sem apagar dados.
# Uso: ./scripts/vps-fix-db-password.sh dhe-apk

set -e

PASSWORD="${1:-dhe-apk}"

if ! docker ps --format '{{.Names}}' | grep -q '^dhe-postgres$'; then
  echo "Container dhe-postgres não está rodando."
  echo "Rode: docker compose -f docker-compose.vps.yml up -d dhe-postgres"
  exit 1
fi

echo "Alterando senha do usuário dhe_app para: $PASSWORD"
docker exec dhe-postgres psql -U dhe_app -d dhe_hidraulicos -c "ALTER USER dhe_app WITH PASSWORD '$PASSWORD';"

echo ""
echo "Agora confirme no .env:"
echo "  DHE_DB_PASSWORD=$PASSWORD"
echo ""
echo "Depois reinicie a API:"
echo "  docker compose -f docker-compose.vps.yml up -d dhe-api --wait"
echo "  curl http://127.0.0.1:8090/health"
