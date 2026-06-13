-- v3: función de uso de base de datos y storage, para avisar antes del límite gratuito

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
