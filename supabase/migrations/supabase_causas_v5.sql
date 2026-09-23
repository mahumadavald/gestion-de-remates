-- Causas v5: checklist jurídico + campos adicionales judicial/concursal
-- Ejecutar en Supabase SQL Editor

-- Checklist completo almacenado como JSONB
-- Estructura: { "C01": { "items": { "causa_identificada": true, ... }, "notas": "", "estado": "pendiente", "completado_at": null, "completado_por": null }, ... }
alter table causas add column if not exists checklist_data jsonb default '{}';

-- Tipo de procedimiento concursal (ordinaria o simplificada/sumaria)
alter table causas add column if not exists tipo_procedimiento text;

-- Campos judiciales
alter table causas add column if not exists caratulado      text;
alter table causas add column if not exists ejecutante      text;  -- acreedor/ejecutante
alter table causas add column if not exists rut_ejecutado   text;

-- Hora y lugar del remate (complementan fecha_remate)
alter table causas add column if not exists fecha_remate_hora  text;
alter table causas add column if not exists fecha_remate_lugar text;

-- Registro de aprobación del remate
alter table causas add column if not exists aprobado_remate_at   timestamptz;
alter table causas add column if not exists aprobado_remate_por  text;

-- Nuevos estados: remate_aprobado y derivada_pre_remate
-- No requieren cambio de columna porque el campo "estado" es text sin CHECK constraint
-- (si hay CHECK constraint, ejecutar esto primero):
-- alter table causas drop constraint if exists causas_estado_check;

-- Índice para el nuevo estado
create index if not exists causas_checklist_gin_idx on causas using gin(checklist_data);
