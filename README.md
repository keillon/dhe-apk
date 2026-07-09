# DHE Hidráulicos — App de Inspeções

Aplicativo profissional para técnicos da **DHE Componentes Hidráulicos** registrarem inspeções e manutenções em equipamentos hidráulicos.

Inspirado na identidade visual do site [dhepr.com.br](https://www.dhepr.com.br/).

## Tecnologias

- React Native + Expo SDK 57
- TypeScript + Expo Router
- NativeWind (Tailwind CSS)
- TanStack React Query + Zustand
- React Hook Form + Zod
- Supabase / PostgreSQL
- MMKV (persistência offline)

## Início rápido

```bash
npm install
npm start
```

### Login demo

- **Email:** `tecnico@dhepr.com.br`
- **Senha:** `123456`

### QR Codes demo

- `DHE-0001` — Prensa Hidráulica 500T
- `DHE-0002` — Injetora Hidráulica
- `DHE-0003` — Guindaste Hidráulico

## Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute `supabase/migrations/001_initial.sql`
3. Copie `.env.example` para `.env` e preencha as credenciais

## Build APK

```bash
npm install -g eas-cli
eas login
npm run build:apk
```

## Estrutura

```
app/           → Telas (Expo Router)
src/
  components/  → Componentes reutilizáveis
  hooks/       → React Query hooks
  services/    → API, Supabase, storage
  store/       → Zustand (auth, tema)
  theme/       → Cores e tipografia DHE
  types/       → TypeScript types
  utils/       → Helpers
supabase/      → Migrations SQL
```

## Identidade visual DHE

| Cor | Hex | Uso |
|-----|-----|-----|
| Azul primário | `#0073FF` | Botões, destaques |
| Azul escuro | `#001423` | Header, fundo escuro |
| Azul claro | `#7CBFE0` | Textos secundários |
| Cinza azulado | `#5396B7` | Labels, muted |
