-- Causas v3: columnas para firma digital del deudor en recepción
-- Ejecutar en Supabase SQL Editor DESPUÉS de v1 y v2

alter table causas add column if not exists firma_deudor_url   text;
alter table causas add column if not exists firma_deudor_nombre text;
alter table causas add column if not exists firma_deudor_rut    text;
alter table causas add column if not exists firma_deudor_fecha  timestamptz;

-- Bucket para firmas (también ejecutar esto)
insert into storage.buckets (id, name, public)
values ('firmas', 'firmas', true)
on conflict (id) do update set public = true;

drop policy if exists "firmas_upload"  on storage.objects;
drop policy if exists "firmas_select"  on storage.objects;
create policy "firmas_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'firmas');
create policy "firmas_select" on storage.objects
  for select to public
  using (bucket_id = 'firmas');
