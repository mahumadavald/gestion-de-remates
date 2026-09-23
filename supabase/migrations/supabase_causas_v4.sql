-- Causas v4: campo bodega_id para saber en qué bodega están los bienes
-- Ejecutar en Supabase SQL Editor

alter table causas add column if not exists bodega_id uuid references bodegas(id);
create index if not exists causas_bodega_id_idx on causas(bodega_id);
