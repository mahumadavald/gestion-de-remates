-- P0-1: Tabla sala_estado — persistencia de estado de sala de remate
-- Aplicar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS sala_estado (
  remate_id  UUID        PRIMARY KEY REFERENCES remates(id) ON DELETE CASCADE,
  idx        INT         NOT NULL DEFAULT 0,
  a_state    TEXT        NOT NULL DEFAULT 'waiting',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sala_estado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sala_estado_authenticated_all" ON sala_estado
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
