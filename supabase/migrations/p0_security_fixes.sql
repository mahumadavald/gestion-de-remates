-- P0 Security fixes — aplicar en Supabase SQL Editor
-- 1. UNIQUE constraint para evitar race condition en número de postor
ALTER TABLE postores
  ADD CONSTRAINT postores_remate_numero_unique UNIQUE (remate_id, numero);

-- 2. RLS causas — reemplazar policy permisiva "causas_all_authenticated" por filtro por casa_id
-- roles es text[] en la tabla usuarios
DROP POLICY "causas_all_authenticated" ON causas;

CREATE POLICY "causas_select_by_casa" ON causas
  FOR SELECT
  USING (
    casa_id = (SELECT casa_id FROM usuarios WHERE id = auth.uid() LIMIT 1)
    OR
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND 'admin' = ANY(roles))
  );

CREATE POLICY "causas_insert_by_casa" ON causas
  FOR INSERT
  WITH CHECK (
    casa_id = (SELECT casa_id FROM usuarios WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "causas_update_by_casa" ON causas
  FOR UPDATE
  USING (
    casa_id = (SELECT casa_id FROM usuarios WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "causas_delete_by_casa" ON causas
  FOR DELETE
  USING (
    casa_id = (SELECT casa_id FROM usuarios WHERE id = auth.uid() LIMIT 1)
  );
