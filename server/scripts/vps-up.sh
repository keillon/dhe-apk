#!/bin/sh
set -e

cd "$(dirname "$0")/.."

echo "=== Subindo DHE API (porta 8090) ==="
docker compose -f docker-compose.vps.yml up -d --build --wait

echo ""
echo "=== Logs recentes ==="
docker compose -f docker-compose.vps.yml logs dhe-api --tail 15

echo ""
echo "=== Teste local ==="
curl -fsS http://127.0.0.1:8090/health && echo "" || {
  echo "Falhou. Aguardando mais 15s..."
  sleep 15
  curl -fsS http://127.0.0.1:8090/health && echo ""
}

echo ""
echo "=== Porta publicada ==="
docker port dhe-api 4002 2>/dev/null || true
ss -tlnp | grep 8090 || true

echo ""
echo "=== IP público (teste do seu PC) ==="
PUBLIC_IP=$(curl -4 -fsS ifconfig.me 2>/dev/null || echo "195.35.40.86")
echo "curl http://${PUBLIC_IP}:8090/health"
