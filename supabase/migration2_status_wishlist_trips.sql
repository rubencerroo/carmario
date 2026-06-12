-- v2: estado/ubicación y precio en items; lista de deseos; maletas de viaje

alter table public.items
  add column status text not null default 'En casa',
  add column status_note text,
  add column price numeric,
  add column purchased_at date;

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
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
  name text not null,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.trip_items (
  trip_id uuid not null references public.trips (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  packed boolean not null default false,
  primary key (trip_id, item_id)
);

-- Extras de maleta que no son del armario (cargador, neceser…)
create table public.trip_extras (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  packed boolean not null default false
);

alter table public.wishes enable row level security;
alter table public.trips enable row level security;
alter table public.trip_items enable row level security;
alter table public.trip_extras enable row level security;

create policy "authenticated full access" on public.wishes
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.trips
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.trip_items
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.trip_extras
  for all to authenticated using (true) with check (true);
