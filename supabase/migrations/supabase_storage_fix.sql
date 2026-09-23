-- Fix RLS en buckets actas-entrega y firmas
-- Ejecutar en Supabase SQL Editor

-- 1. Asegurar que los buckets existen y son públicos
insert into storage.buckets (id, name, public)
values ('actas-entrega', 'actas-entrega', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('firmas', 'firmas', true)
on conflict (id) do update set public = true;

-- 2. Limpiar todas las políticas anteriores de estos buckets
drop policy if exists "actas_upload"  on storage.objects;
drop policy if exists "actas_select"  on storage.objects;
drop policy if exists "actas_update"  on storage.objects;
drop policy if exists "actas_delete"  on storage.objects;
drop policy if exists "firmas_upload" on storage.objects;
drop policy if exists "firmas_select" on storage.objects;

-- 3. Política permisiva para actas-entrega (autenticados pueden todo)
create policy "actas_entrega_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'actas-entrega')
  with check (bucket_id = 'actas-entrega');

-- Lectura pública para actas (para poder ver los archivos sin auth)
create policy "actas_entrega_public_read" on storage.objects
  for select to public
  using (bucket_id = 'actas-entrega');

-- 4. Política permisiva para firmas (autenticados pueden todo)
create policy "firmas_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'firmas')
  with check (bucket_id = 'firmas');

-- Lectura pública para firmas
create policy "firmas_public_read" on storage.objects
  for select to public
  using (bucket_id = 'firmas');
