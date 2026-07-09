# Deploy DHE na VPS (banco PostgreSQL isolado)

## Setup — porta 8090

| Porta | Situação |
|-------|----------|
| 4002 | Bloqueada pelo provedor |
| 80 | `301 Moved Permanently` (Traefik → HTTPS) |
| **8090** | Use esta |

### Subir na VPS

```bash
cd /var/www/dhe-apk/server
git pull
chmod +x scripts/vps-up.sh
./scripts/vps-up.sh
```

O script usa `--wait` e só testa o health **depois** da API ficar pronta.

**Não rode `curl` logo após o `up`** — espere ver nos logs:
```
DHE API rodando na porta 4002
```

### Teste manual

```bash
# Na VPS (use 127.0.0.1, não localhost)
curl http://127.0.0.1:8090/health

# No seu PC
curl http://195.35.40.86:8090/health
```

### Se local OK mas PC/celular falha (UFW + Docker)

O UFW pode bloquear portas publicadas pelo Docker. Rode na VPS:

```bash
# Ver se a porta está aberta
ss -tlnp | grep 8090
docker port dhe-api

# Liberar encaminhamento Docker → container
sudo iptables -I DOCKER-USER -p tcp --dport 8090 -j ACCEPT
```

Ou no painel Hostinger, libere **8090 TCP** no firewall do servidor.

### App / APK

```env
EXPO_PUBLIC_API_URL=http://195.35.40.86:8090
```

```bash
npm run start:clean
eas build --platform android --profile preview
```

### Credenciais

- Email: `tecnico@dhepr.com.br`
- Senha: `123456`

### Logs se der erro

```bash
docker compose -f docker-compose.vps.yml logs dhe-api --tail 50
docker compose -f docker-compose.vps.yml ps
```
