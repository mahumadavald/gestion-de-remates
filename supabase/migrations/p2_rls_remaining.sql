-- P2: RLS en tablas restantes
-- Requiere: auth_casa_id() y auth_is_admin() ya creadas (p1_rls_casa_id.sql)
-- Aplicar en Supabase SQL Editor

-- ── CAUSAS ────────────────────────────────────────────────────────────────────
-- Reemplaza la política permisiva "causas_all_authenticated" (USING true)
-- que permitía ver causas de todas las casas.

ALTER TABLE causas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "causas_all_authenticated" ON causas;
DROP POLICY IF EXISTS "causas_authenticated"     ON causas;
DROP POLICY IF EXISTS "causas_select"            ON causas;
DROP POLICY IF EXISTS "causas_insert"            ON causas;
DROP POLICY IF EXISTS "causas_update"            ON causas;
DROP POLICY IF EXISTS "causas_delete"            ON causas;

CREATE POLICY "causas_select" ON causas FOR SELECT
  USING (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "causas_insert" ON causas FOR INSERT
  WITH CHECK (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "causas_update" ON causas FOR UPDATE
  USING (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "causas_delete" ON causas FOR DELETE
  USING (casa_id = auth_casa_id() OR auth_is_admin());

-- ── BODEGAS ───────────────────────────────────────────────────────────────────
-- Sin RLS hasta ahora: cualquier autenticado podía ver bodegas de todas las casas.

ALTER TABLE bodegas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bodegas_select" ON bodegas;
DROP POLICY IF EXISTS "bodegas_insert" ON bodegas;
DROP POLICY IF EXISTS "bodegas_update" ON bodegas;
DROP POLICY IF EXISTS "bodegas_delete" ON bodegas;

CREATE POLICY "bodegas_select" ON bodegas FOR SELECT
  USING (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "bodegas_insert" ON bodegas FOR INSERT
  WITH CHECK (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "bodegas_update" ON bodegas FOR UPDATE
  USING (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "bodegas_delete" ON bodegas FOR DELETE
  USING (casa_id = auth_casa_id() OR auth_is_admin());
