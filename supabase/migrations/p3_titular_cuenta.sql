-- P3: Columna titular_cuenta en postores
-- Permite registrar el nombre del titular de la cuenta bancaria en el flujo de devoluciones.
-- Aplicar en Supabase SQL Editor.

ALTER TABLE postores
  ADD COLUMN IF NOT EXISTS titular_cuenta text DEFAULT NULL;
