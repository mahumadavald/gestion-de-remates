-- ================================================================
-- Migración: columnas pendientes agregadas por el código pero
-- no incluidas en las migraciones anteriores.
-- Ejecutar en Supabase SQL Editor (es idempotente con IF NOT EXISTS).
-- ================================================================

-- 1. fotos_urls en actas_recepcion_vehiculos
--    Usada en PageActasRecepcion para subir fotos del vehículo
alter table actas_recepcion_vehiculos
  add column if not exists fotos_urls text[] default null;

-- 2. bodega_id en actas_recepcion_vehiculos
--    Vincula el acta a la bodega del usuario que la crea
alter table actas_recepcion_vehiculos
  add column if not exists bodega_id uuid references bodegas(id) on delete set null default null;

-- 3. retiro_por en liquidaciones
--    Nombre/email del operario que confirmó la entrega (trazabilidad)
alter table liquidaciones
  add column if not exists retiro_por text default null;

-- 4. devolucion_enviada en postores
--    Flag que indica si la garantía fue devuelta al postor
alter table postores
  add column if not exists devolucion_enviada boolean default false;

-- Índice útil para la vista de devoluciones pendientes
create index if not exists postores_devolucion_idx
  on postores(devolucion_enviada)
  where devolucion_enviada = false;
