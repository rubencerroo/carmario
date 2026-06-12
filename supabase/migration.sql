-- Esquema de Mi Armario
-- Tablas: items (prendas, colonias, maquillaje), outfits, outfit_items, calendar_entries
-- Seguridad: solo usuarios autenticados pueden leer/escribir (app de un solo usuario).

create table public.items (
  id uuid primary key default gen_random_uuid(),
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
  created_at timestamptz not null default now()
);

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
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
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  primary key (outfit_id, item_id)
);

create table public.calendar_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  outfit_id uuid references public.outfits (id) on delete set null,
  notes text
);

alter table public.items enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;
alter table public.calendar_entries enable row level security;

create policy "authenticated full access" on public.items
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.outfits
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.outfit_items
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.calendar_entries
  for all to authenticated using (true) with check (true);

-- Bucket de fotos: lectura pública (las rutas son UUIDs aleatorios), escritura solo autenticada.
insert into storage.buckets (id, name, public) values ('photos', 'photos', true);

create policy "photos read" on storage.objects
  for select using (bucket_id = 'photos');
create policy "photos insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos');
create policy "photos delete" on storage.objects
  for delete to authenticated using (bucket_id = 'photos');
