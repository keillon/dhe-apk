# Deploy DHE na VPS (stack isolada)

## Opção recomendada: PostgreSQL isolado em Docker

Esta opção **não mexe** nos bancos dos outros projetos (lpfenix, brprixx, fenixlog, chat-interno).

### 1. Copiar para a VPS

```bash
scp -r server/ root@srv754793:/var/www/dhe-app/server/
```

### 2. Configurar variáveis

```bash
cd /var/www/dhe-app/server
cp .env.example .env
nano .env   # defina DHE_DB_PASSWORD, JWT_SECRET, DHE_API_HOST
```

### 3. Rede Traefik (se ainda não existir)

```bash
docker network create traefik-public 2>/dev/null || true
```

### 4. Subir stack DHE

```bash
docker compose up -d --build
```

### 5. Rodar seed (dados demo)

```bash
docker compose exec dhe-api npx tsx prisma/seed.ts
```

### 6. Verificar

```bash
curl https://SEU_DOMINIO/health
# Deve retornar: {"status":"ok","database":"connected",...}

npm run test:db
```

**Importante:** o domínio em `DHE_API_HOST` precisa existir no DNS (registro A apontando para o IP da VPS). Sem isso o app não consegue conectar.

No app mobile, configure na raiz do projeto:

```
EXPO_PUBLIC_API_URL=https://SEU_DOMINIO
```

Depois reinicie o Expo (`npm run start:clean`).

---

## Opção alternativa: PostgreSQL já instalado no host

Use **somente** se quiser reutilizar o Postgres da VPS.

```bash
DHE_DB_PASSWORD='senha_forte' ./scripts/create-dhe-database-only.sh
```

Depois ajuste o `.env`:

```
DATABASE_URL=postgresql://dhe_app:SENHA@localhost:5432/dhe_hidraulicos?schema=public
```

E rode migrations:

```bash
npm run db:migrate
npm run db:seed
```

---

## Segurança

| O que faz | O que NÃO faz |
|-----------|---------------|
| Cria banco `dhe_hidraulicos` | Não apaga outros bancos |
| Cria usuário `dhe_app` | Não altera usuários existentes |
| Volume `dhe_postgres_data` isolado | Não compartilha dados com outros apps |
| Container `dhe-postgres` separado | Não reinicia outros containers |

## Credenciais demo (após seed)

- Email: `tecnico@dhepr.com.br`
- Senha: `123456`
