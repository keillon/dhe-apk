# DHE Hidráulicos — App de Inspeções

## App mobile

```bash
npm install
cp .env.example .env
npm run start:clean
```

```env
EXPO_PUBLIC_API_URL=http://195.35.40.86:8090
```

Login: `tecnico@dhepr.com.br` / `123456`

## API na VPS

```bash
cd server
docker compose -f docker-compose.vps.yml up -d --build
curl http://195.35.40.86:8090/health
```

Veja [server/DEPLOY.md](server/DEPLOY.md).

## Build APK

```bash
eas build --platform android --profile preview
```
