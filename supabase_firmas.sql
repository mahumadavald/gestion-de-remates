-- Agregar columnas de firma a las tablas de actas
-- Ejecutar en Supabase SQL Editor

-- Actas de Recepción de Vehículos (judiciales)
alter table actas_recepcion_vehiculos
  add column if not exists firma_entrega_url text,
  add column if not exists firma_recibe_url  text;

-- Actas de Entrega (concursales)
alter table actas_entrega
  add column if not exists firma_url text;

-- Bucket de firmas: crear manualmente en Supabase Dashboard → Storage → New Bucket
-- Nombre: firmas
-- Public: true (para que la URL pública funcione)
-- Allowed MIME types: image/png
