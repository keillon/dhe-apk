# Deploy DHE na VPS (banco PostgreSQL isolado)

## Setup por IP — sem site/domínio (recomendado agora)

### 1. Na VPS — subir API + banco

```bash
cd /var/www/dhe-app/server   # ou onde clonou o repo
git pull
cp .env.example .env
nano .env   # DHE_DB_PASSWORD e JWT_SECRET
```

Edite o `.env` da VPS:

```env
DHE_DB_PASSWORD=sua_senha_forte
JWT_SECRET=seu_jwt_longo_e_aleatorio
PORT=4002
NODE_ENV=production
DATABASE_URL=postgresql://dhe_app:sua_senha_forte@dhe-postgres:5432/dhe_hidraulicos?schema=public
```

Suba com o compose **sem Traefik** (expõe porta 4002 no IP):

```bash
docker compose -f docker-compose.vps.yml up -d --build
docker compose -f docker-compose.vps.yml exec dhe-api npx prisma migrate deploy
docker compose -f docker-compose.vps.yml exec dhe-api npx tsx prisma/seed.ts
```

### 2. Liberar porta no firewall da VPS

```bash
ufw allow 4002/tcp
ufw status
```

**Também abra a porta 4002 TCP no painel do provedor** (Hostinger, etc.). Sem isso o APK no celular não alcança a API.

Teste de fora da VPS (no seu PC):
```bash
curl http://195.35.40.86:4002/health
```

### 3. Testar na VPS

```bash
curl http://localhost:4002/health
# Esperado: {"status":"ok","database":"connected",...}
```

### 4. No PC — configurar o app

Na **raiz** do projeto (não em `server/`), crie `.env`:

```env
EXPO_PUBLIC_API_URL=http://195.35.40.86:4002
```

Troque `195.35.40.86` pelo IP real da VPS.

Reinicie o Expo:

```bash
npm run start:clean
```

No app → **Perfil** deve mostrar **"Conectado ao banco VPS"** com o IP.

### 5. Credenciais (após seed)

- Email: `tecnico@dhepr.com.br`
- Senha: `123456`

---

## Opção futura: com domínio + Traefik

Quando tiver site/domínio, use `docker-compose.yml` (com Traefik) e:

```env
EXPO_PUBLIC_API_URL=https://api-dhe.seudominio.com.br
```

---

## Opção alternativa: PostgreSQL já instalado no host

```bash
DHE_DB_PASSWORD='senha_forte' ./scripts/create-dhe-database-only.sh
```

Depois no `.env`:

```
DATABASE_URL=postgresql://dhe_app:SENHA@localhost:5432/dhe_hidraulicos?schema=public
```

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

---

## Segurança

| O que faz | O que NÃO faz |
|-----------|---------------|
| Cria banco `dhe_hidraulicos` | Não apaga outros bancos |
| Cria usuário `dhe_app` | Não altera usuários existentes |
| Volume `dhe_postgres_data` isolado | Não compartilha dados com outros apps |
| Container `dhe-postgres` separado | Não reinicia outros containers |

## Troubleshooting

| Problema | Solução |
|----------|---------|
| App mostra "Modo demonstração" | `EXPO_PUBLIC_API_URL` está vazio ou no lugar errado — deve ficar na **raiz** do app |
| Login falha / timeout | Porta 4002 fechada no firewall ou containers parados |
| `database: disconnected` no health | Postgres não subiu — `docker compose -f docker-compose.vps.yml logs dhe-postgres` |
| Inspeção não salva | Faça logout e login de novo (token antigo do modo demo) |
