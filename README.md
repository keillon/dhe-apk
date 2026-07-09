# DHE Hidráulicos — App de Inspeções

Aplicativo profissional para técnicos da **DHE Componentes Hidráulicos**.

## App mobile

```bash
npm install
cp .env.example .env   # EXPO_PUBLIC_API_URL=http://IP_VPS
npm run start:clean
```

No **Perfil** → **"Conectado ao banco VPS"**.

- Email: `tecnico@dhepr.com.br`
- Senha: `123456`

## API + Banco na VPS

Veja [server/DEPLOY.md](server/DEPLOY.md).

```bash
# Na VPS — porta 80 via Traefik (recomendado)
cd server
docker compose -f docker-compose.vps-traefik.yml up -d --build
curl http://195.35.40.86/health
```

No PC / APK:

```env
EXPO_PUBLIC_API_URL=http://195.35.40.86
```

## Build APK

```bash
eas build --platform android --profile preview
```
