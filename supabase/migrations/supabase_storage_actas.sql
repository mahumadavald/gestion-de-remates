-- Permisos del bucket "actas-entrega" en Supabase Storage
-- Ejecutar en Supabase SQL Editor

-- Crear el bucket si no existe
insert into storage.buckets (id, name, public)
values ('actas-entrega', 'actas-entrega', true)
on conflict (id) do update set public = true;

-- Eliminar políticas viejas si existen
drop policy if exists "actas_upload"  on storage.objects;
drop policy if exists "actas_select"  on storage.objects;
drop policy if exists "actas_update"  on storage.objects;
drop policy if exists "actas_delete"  on storage.objects;

-- Política: usuarios autenticados pueden subir
create policy "actas_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'actas-entrega');

-- Política: todos pueden leer (URL pública)
create policy "actas_select" on storage.objects
  for select to public
  using (bucket_id = 'actas-entrega');

-- Política: usuarios autenticados pueden reemplazar
create policy "actas_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'actas-entrega');
