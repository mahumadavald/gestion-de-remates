-- P4: FK lote_id en liquidaciones
-- Permite join robusto lote↔liquidacion sin depender del nombre como string.
-- Aplicar en Supabase SQL Editor.

ALTER TABLE liquidaciones
  ADD COLUMN IF NOT EXISTS lote_id uuid REFERENCES lotes(id) ON DELETE SET NULL DEFAULT NULL;

CREATE INDEX IF NOT EXISTS liquidaciones_lote_id_idx ON liquidaciones(lote_id) WHERE lote_id IS NOT NULL;
