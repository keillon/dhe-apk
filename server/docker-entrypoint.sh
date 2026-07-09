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
npx prisma migrate deploy

echo "[dhe-api] Subindo servidor na porta ${PORT:-4002}..."
exec node dist/index.js
