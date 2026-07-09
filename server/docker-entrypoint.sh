#!/bin/sh
set -e

echo "[dhe-api] Iniciando..."

if [ -z "$DATABASE_URL" ]; then
  echo "[dhe-api] ERRO: DATABASE_URL não definida"
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "[dhe-api] ERRO: JWT_SECRET não definida"
  exit 1
fi

echo "[dhe-api] Aplicando migrations..."
if ! npx prisma migrate deploy; then
  echo "[dhe-api] ERRO: migrate falhou. Verifique DHE_DB_PASSWORD no .env (deve ser: dhe-apk)"
  exit 1
fi

echo "[dhe-api] Preparando diretório de uploads..."
mkdir -p /app/uploads

echo "[dhe-api] Subindo servidor na porta ${PORT:-4002}..."
exec node dist/index.js
