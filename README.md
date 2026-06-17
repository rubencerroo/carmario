# 👗 Carmario

App web multiusuario para guardar tu armario, crear outfits y llevar un diario de looks. Incluye ropa, colonias y maquillaje, con fotos, favoritos, etiquetas, estado/ubicación de prendas, lista de deseos, maletas de viaje, calendario y estadísticas.

Cada persona se registra con su email y contraseña y solo ve sus propios datos.

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
| `VITE_SUPABASE_ANON_KEY` | Clave pública (publishable) de Supabase |

En Cloudflare Pages hay que definir estas dos variables en *Settings → Environment variables* (van embebidas en el build, así que al cambiarlas hay que volver a desplegar).

## Base de datos

El esquema completo está en [supabase/schema.sql](supabase/schema.sql): tablas `items`, `outfits`, `outfit_items`, `calendar_entries`, `wishes`, `trips`, `trip_items` y `trip_extras`. Cada tabla tiene `user_id` (por defecto `auth.uid()`) y políticas RLS que aíslan los datos por usuario. Las fotos se guardan en el bucket `photos`, cada usuario en su propia carpeta (`user_id/uuid.webp`).

Las fotos se comprimen en el navegador (máx. 1200 px, WebP) antes de subirse.

### Autenticación

Registro abierto con email + contraseña, **sin verificación de email**. Para ello, en el panel de Supabase: *Authentication → Sign In / Providers → Email → desactivar "Confirm email"*.

### Espacio (plan gratuito)

Límites **por proyecto** (no por tabla): 500 MB de base de datos y **1 GB de Storage** (fotos), compartidos entre todos los usuarios. La app avisa al acercarse al límite.

> **Si en el futuro hace falta más espacio para fotos:** mover el bucket a **Cloudflare R2** (10 GB gratis en la misma cuenta de Cloudflare ≈ x10). Implicaría cambiar `uploadPhoto`/`photoUrl`/`deletePhoto` en `src/lib/supabase.ts` para usar R2 en vez de Supabase Storage, y subir las imágenes vía una función (R2 no expone subida directa desde el navegador con las claves públicas).

## Deploy

La app está en producción en **https://carmario.pages.dev** (Cloudflare Pages).

Para publicar cambios:

```bash
npm run deploy
```

(compila y sube `dist` con wrangler; requiere `npx wrangler login` la primera vez)
