# 👗 Mi Armario

App web para guardar el armario, crear outfits y llevar un diario de looks. Incluye ropa, colonias y maquillaje, con fotos, favoritos, etiquetas y calendario.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Datos y fotos:** Supabase (Postgres + Storage + Auth), plan gratuito
- **Hosting:** Cloudflare Pages, plan gratuito

## Desarrollo local

```bash
npm install
cp .env.example .env   # y rellenar valores
npm run dev
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase |
| `VITE_APP_EMAIL` | Email del único usuario (el login solo pide contraseña) |

En Cloudflare Pages hay que definir estas tres variables en *Settings → Environment variables*.

## Base de datos

El esquema completo está en [supabase/migration.sql](supabase/migration.sql): tablas `items`, `outfits`, `outfit_items` y `calendar_entries`, políticas RLS (solo usuarios autenticados) y el bucket `photos`.

Las fotos se comprimen en el navegador (máx. 1200 px, WebP) antes de subirse, así el 1 GB gratuito de Storage da para miles de prendas.

## Deploy

La app está en producción en **https://armario-ale.pages.dev** (Cloudflare Pages).

Para publicar cambios:

```bash
npm run deploy
```

(compila y sube `dist` con wrangler; requiere `npx wrangler login` la primera vez)
