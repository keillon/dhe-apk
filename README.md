# DHE Hidráulicos — App de Inspeções

Aplicativo profissional para técnicos da **DHE Componentes Hidráulicos**.

## Arquitetura

```
dhe-app/
├── app/              # App mobile (Expo/React Native)
├── src/              # Código do app
└── server/           # API REST + Prisma + PostgreSQL
```

- **Mobile**: Expo + React Native + NativeWind
- **Backend**: Express + Prisma ORM + PostgreSQL
- **Banco**: PostgreSQL isolado (`dhe_hidraulicos`) — não interfere em outros projetos

## App mobile

```bash
npm install
cp .env.example .env   # EXPO_PUBLIC_API_URL
npm start
```

**Demo local** (sem API): deixe `EXPO_PUBLIC_API_URL` vazio ou com placeholder.

- Email: `tecnico@dhepr.com.br`
- Senha: `123456`

## API + Banco (VPS)

Veja [server/DEPLOY.md](server/DEPLOY.md) para deploy seguro na VPS.

```bash
cd server
npm install
cp .env.example .env
npm run db:migrate:dev
npm run db:seed
npm run dev
```

### Deploy Docker (recomendado)

Stack isolada com PostgreSQL próprio — **não mexe nos outros bancos/containers**.

```bash
cd server
docker compose up -d --build
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
