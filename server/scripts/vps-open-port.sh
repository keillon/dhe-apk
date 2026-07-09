#!/bin/sh
# Libera acesso externo à porta 8090 (Docker + UFW + iptables).
# Rode na VPS como root: ./scripts/vps-open-port.sh

set -e

PORT=8090

echo "=== Liberando porta $PORT para acesso externo ==="

if command -v ufw >/dev/null 2>&1; then
  ufw allow "$PORT/tcp" 2>/dev/null || true
  ufw route allow "$PORT/tcp" 2>/dev/null || true
  echo "UFW: regra $PORT/tcp aplicada"
fi

if command -v iptables >/dev/null 2>&1; then
  iptables -C DOCKER-USER -p tcp --dport "$PORT" -j ACCEPT 2>/dev/null ||
    iptables -I DOCKER-USER -p tcp --dport "$PORT" -j ACCEPT
  echo "iptables: DOCKER-USER aceita porta $PORT"
fi

PUBLIC_IP=$(curl -4 -fsS ifconfig.me 2>/dev/null || echo "195.35.40.86")

echo ""
echo "=== Testes ==="
echo -n "Local:  "
curl -fsS "http://127.0.0.1:$PORT/health" && echo "" || echo "FALHOU"

echo -n "Público: "
curl -fsS --connect-timeout 5 "http://${PUBLIC_IP}:$PORT/health" && echo "" || {
  echo "FALHOU"
  echo ""
  echo "Se local OK mas público falha:"
  echo "  1. Abra a porta $PORT TCP no painel Hostinger (Firewall do servidor)"
  echo "  2. Rode de novo após liberar no painel"
}

echo ""
echo "Teste no seu PC:"
echo "  curl http://${PUBLIC_IP}:$PORT/health"
