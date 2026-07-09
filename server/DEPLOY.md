# Deploy DHE na VPS (banco PostgreSQL isolado)

## Setup recomendado — porta 8090

| Porta | Situação |
|-------|----------|
| 4002 | Bloqueada pelo provedor (Hostinger) |
| 80 | Redireciona pra HTTPS (`Moved Permanently`) — não serve a API |
| **8090** | Liberada no UFW — **use esta** |

### 1. Na VPS

```bash
cd /var/www/dhe-apk/server
git pull
nano .env   # DHE_DB_PASSWORD, JWT_SECRET
```

```env
DHE_DB_PASSWORD=sua_senha_forte
JWT_SECRET=seu_jwt_longo_e_aleatorio
PORT=4002
NODE_ENV=production
DATABASE_URL=postgresql://dhe_app:sua_senha_forte@dhe-postgres:5432/dhe_hidraulicos?schema=public
```

### 2. Subir API na porta 8090

```bash
# Parar outros composes se estiverem rodando
docker compose -f docker-compose.vps-traefik.yml down 2>/dev/null || true
docker compose -f docker-compose.vps.yml down

docker compose -f docker-compose.vps.yml up -d --build
docker compose -f docker-compose.vps.yml exec dhe-api npx tsx prisma/seed.ts
```

### 3. Testar

Na VPS:
```bash
curl http://localhost:8090/health
```

No seu PC:
```bash
curl http://195.35.40.86:8090/health
```

Esperado:
```json
{"status":"ok","database":"connected",...}
```

### 4. App / APK

Na **raiz** do projeto:

```env
EXPO_PUBLIC_API_URL=http://195.35.40.86:8090
```

```bash
npm run start:clean
eas build --platform android --profile preview
```

### 5. Credenciais

- Email: `tecnico@dhepr.com.br`
- Senha: `123456`

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `curl :80/health` → Moved Permanently | Normal — Traefik redireciona HTTP→HTTPS. Use porta **8090** |
| `:4002` timeout | Provedor bloqueia. Use porta **8090** |
| App em modo demonstração | `EXPO_PUBLIC_API_URL` na **raiz** do app, não em `server/` |
| Login falha no APK | Gere APK novo após mudar a URL |
