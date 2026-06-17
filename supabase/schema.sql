-- Esquema de Carmario (multiusuario)
-- Cada fila pertenece a un usuario (user_id = auth.uid()). RLS aísla los datos por usuario.
-- Tablas: items, outfits, outfit_items, calendar_entries, wishes, trips, trip_items, trip_extras.

-- Helper: por defecto user_id = usuario autenticado, así el cliente no tiene que enviarlo.

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('prenda', 'colonia', 'maquillaje')),
  name text not null,
  category text not null,
  brand text,
  color text,
  season text,
  tags text[] not null default '{}',
  notes text,
  image_path text,
  favorite boolean not null default false,
  status text not null default 'En casa',
  status_note text,
  price numeric,
  purchased_at date,
  created_at timestamptz not null default now()
);

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  occasion text,
  season text,
  tags text[] not null default '{}',
  notes text,
  image_path text,
  favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.outfit_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  primary key (outfit_id, item_id)
);

create table public.calendar_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  outfit_id uuid references public.outfits (id) on delete set null,
  notes text,
  unique (user_id, date)
);

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  store text,
  price numeric,
  url text,
  notes text,
  image_path text,
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.trip_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  packed boolean not null default false,
  primary key (trip_id, item_id)
);

create table public.trip_extras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  packed boolean not null default false
);

-- Índices por usuario (las consultas siempre filtran por user_id vía RLS)
create index on public.items (user_id);
create index on public.outfits (user_id);
create index on public.wishes (user_id);
create index on public.trips (user_id);

-- RLS: cada usuario solo ve y modifica sus propias filas.
alter table public.items enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;
alter table public.calendar_entries enable row level security;
alter table public.wishes enable row level security;
alter table public.trips enable row level security;
alter table public.trip_items enable row level security;
alter table public.trip_extras enable row level security;

create policy "own rows" on public.items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.outfits
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.outfit_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.calendar_entries
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.wishes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.trips
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.trip_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.trip_extras
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Bucket de fotos: cada usuario sube a su carpeta (user_id/uuid.webp).
-- El bucket es público (las imágenes se sirven por URL pública), pero las políticas de
-- storage.objects restringen listar/escribir/borrar a la carpeta del propio usuario.
insert into storage.buckets (id, name, public) values ('photos', 'photos', true);

create policy "photos read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos insert own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Uso de base de datos y storage del proyecto (informativo, para avisar antes del límite gratuito).
create or replace function public.get_usage()
returns json
language sql
security definer
set search_path = ''
as $$
  select json_build_object(
    'db_bytes', pg_database_size(current_database()),
    'storage_bytes', coalesce(
      (select sum((metadata->>'size')::bigint) from storage.objects where bucket_id = 'photos'),
      0
    )
  );
$$;

revoke execute on function public.get_usage() from public, anon;
grant execute on function public.get_usage() to authenticated;
