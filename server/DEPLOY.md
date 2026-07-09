# Deploy DHE na VPS (banco PostgreSQL isolado)

## Setup recomendado — porta 80 via Traefik (sem domínio)

A Hostinger e outros provedores **bloqueiam portas customizadas** (4002) mesmo com UFW aberto.
A solução é expor a API pela **porta 80**, que já está liberada.

### 1. Na VPS — configurar `.env`

```bash
cd /var/www/dhe-apk/server
git pull
nano .env
```

```env
DHE_DB_PASSWORD=sua_senha_forte
JWT_SECRET=seu_jwt_longo_e_aleatorio
PORT=4002
NODE_ENV=production
DATABASE_URL=postgresql://dhe_app:sua_senha_forte@dhe-postgres:5432/dhe_hidraulicos?schema=public
DHE_VPS_IP=195.35.40.86
```

### 2. Subir com Traefik (porta 80)

```bash
docker network create traefik-public 2>/dev/null || true

# Parar compose antigo na 4002 (se estiver rodando)
docker compose -f docker-compose.vps.yml down

# Subir pela porta 80
docker compose -f docker-compose.vps-traefik.yml up -d --build
docker compose -f docker-compose.vps-traefik.yml exec dhe-api npx tsx prisma/seed.ts
```

### 3. Testar

Na VPS:
```bash
curl http://localhost:4002/health          # interno — deve funcionar
curl http://195.35.40.86/health          # externo via Traefik porta 80
```

No seu PC:
```bash
curl http://195.35.40.86/health
```

Esperado:
```json
{"status":"ok","database":"connected",...}
```

### 4. Configurar o app / APK

Na **raiz** do projeto:

```env
EXPO_PUBLIC_API_URL=http://195.35.40.86
```

**Sem `:4002`** — usa porta 80.

```bash
npm run start:clean
# ou gere novo APK:
eas build --platform android --profile preview
```

### 5. Credenciais (após seed)

- Email: `tecnico@dhepr.com.br`
- Senha: `123456`

---

## Alternativa — porta 4002 direta

Só funciona se o **painel do provedor** liberar a porta 4002.

```bash
docker compose -f docker-compose.vps.yml up -d --build
```

```env
EXPO_PUBLIC_API_URL=http://195.35.40.86:4002
```

---

## Opção futura: com domínio + HTTPS

Quando tiver site/domínio, use `docker-compose.yml` (Traefik + SSL):

```env
EXPO_PUBLIC_API_URL=https://api-dhe.seudominio.com.br
```

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `localhost:4002` OK, IP externo falha | Use `docker-compose.vps-traefik.yml` (porta 80) |
| App mostra "Modo demonstração" | `EXPO_PUBLIC_API_URL` vazio ou na pasta errada — deve ficar na **raiz** |
| Login falha no APK | Gere APK novo após mudar URL; confira `usesCleartextTraffic` |
| `database: disconnected` | `docker compose -f docker-compose.vps-traefik.yml logs dhe-api` |
| Traefik não roteia | Confirme `DHE_VPS_IP` no `.env` e rede `traefik-public` |
