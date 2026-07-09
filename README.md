# DHE Hidráulicos — App de Inspeções

Aplicativo profissional para técnicos da **DHE Componentes Hidráulicos**.

## Arquitetura

```
dhe-app/
├── app/              # App mobile (Expo/React Native)
├── src/              # Código do app
└── server/           # API REST + Prisma + PostgreSQL (VPS)
```

- **Mobile**: Expo + React Native + NativeWind
- **Backend**: Express + Prisma ORM + PostgreSQL na VPS
- **Banco**: PostgreSQL isolado (`dhe_hidraulicos`)

## App mobile

```bash
npm install
cp .env.example .env   # EXPO_PUBLIC_API_URL=http://IP_VPS:4002
npm run start:clean
```

No **Perfil** do app deve aparecer **"Conectado ao banco VPS"**.

- Email: `tecnico@dhepr.com.br`
- Senha: `123456`

## API + Banco na VPS (sem domínio)

Veja [server/DEPLOY.md](server/DEPLOY.md) — usa o **IP da VPS** na porta **4002**.

```bash
# Na VPS
cd server
docker compose -f docker-compose.vps.yml up -d --build
docker compose -f docker-compose.vps.yml exec dhe-api npx prisma migrate deploy
docker compose -f docker-compose.vps.yml exec dhe-api npx tsx prisma/seed.ts
curl http://localhost:4002/health
```

No PC (raiz do app):

```env
EXPO_PUBLIC_API_URL=http://195.35.40.86:4002
```

## Build APK

```bash
npm run build:apk
```

## Identidade visual DHE

Cores extraídas de [dhepr.com.br](https://www.dhepr.com.br/):

| Cor | Hex |
|-----|-----|
| Azul primário | `#0073FF` |
| Azul escuro | `#001423` |
| Azul claro | `#7CBFE0` |
