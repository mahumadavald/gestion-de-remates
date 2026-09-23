-- Fix RLS de la tabla causas
-- Ejecutar en Supabase SQL Editor

-- Eliminar políticas existentes que puedan estar bloqueando
drop policy if exists "causas_authenticated" on causas;
drop policy if exists "causas_select" on causas;
drop policy if exists "causas_insert" on causas;
drop policy if exists "causas_update" on causas;
drop policy if exists "causas_delete" on causas;

-- Política permisiva para todos los usuarios autenticados
create policy "causas_all_authenticated"
  on causas for all
  to authenticated
  using (true)
  with check (true);
