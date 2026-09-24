-- P1: RLS por casa_id en tablas principales
-- Aplicar en Supabase SQL Editor
-- Requisito: tabla usuarios con columnas casa_id y roles (text[])

-- ── HELPER: función para obtener casa_id del usuario autenticado ──────────────
-- (evita subquery repetida en cada policy)
CREATE OR REPLACE FUNCTION auth_casa_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT casa_id FROM usuarios WHERE id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND 'admin' = ANY(roles))
$$;

-- ── REMATES ───────────────────────────────────────────────────────────────────
ALTER TABLE remates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "remates_select" ON remates;
DROP POLICY IF EXISTS "remates_insert" ON remates;
DROP POLICY IF EXISTS "remates_update" ON remates;
DROP POLICY IF EXISTS "remates_delete" ON remates;

CREATE POLICY "remates_select" ON remates FOR SELECT
  USING (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "remates_insert" ON remates FOR INSERT
  WITH CHECK (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "remates_update" ON remates FOR UPDATE
  USING (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "remates_delete" ON remates FOR DELETE
  USING (casa_id = auth_casa_id() OR auth_is_admin());

-- ── LOTES ─────────────────────────────────────────────────────────────────────
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lotes_select" ON lotes;
DROP POLICY IF EXISTS "lotes_insert" ON lotes;
DROP POLICY IF EXISTS "lotes_update" ON lotes;
DROP POLICY IF EXISTS "lotes_delete" ON lotes;

CREATE POLICY "lotes_select" ON lotes FOR SELECT
  USING (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "lotes_insert" ON lotes FOR INSERT
  WITH CHECK (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "lotes_update" ON lotes FOR UPDATE
  USING (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "lotes_delete" ON lotes FOR DELETE
  USING (casa_id = auth_casa_id() OR auth_is_admin());

-- ── POSTORES ──────────────────────────────────────────────────────────────────
ALTER TABLE postores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "postores_select" ON postores;
DROP POLICY IF EXISTS "postores_insert" ON postores;
DROP POLICY IF EXISTS "postores_update" ON postores;
DROP POLICY IF EXISTS "postores_delete" ON postores;

CREATE POLICY "postores_select" ON postores FOR SELECT
  USING (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "postores_insert" ON postores FOR INSERT
  WITH CHECK (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "postores_update" ON postores FOR UPDATE
  USING (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "postores_delete" ON postores FOR DELETE
  USING (casa_id = auth_casa_id() OR auth_is_admin());

-- ── LIQUIDACIONES ─────────────────────────────────────────────────────────────
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "liquidaciones_select" ON liquidaciones;
DROP POLICY IF EXISTS "liquidaciones_insert" ON liquidaciones;
DROP POLICY IF EXISTS "liquidaciones_update" ON liquidaciones;
DROP POLICY IF EXISTS "liquidaciones_delete" ON liquidaciones;

CREATE POLICY "liquidaciones_select" ON liquidaciones FOR SELECT
  USING (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "liquidaciones_insert" ON liquidaciones FOR INSERT
  WITH CHECK (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "liquidaciones_update" ON liquidaciones FOR UPDATE
  USING (casa_id = auth_casa_id() OR auth_is_admin());

CREATE POLICY "liquidaciones_delete" ON liquidaciones FOR DELETE
  USING (casa_id = auth_casa_id() OR auth_is_admin());

-- ── GARANTIAS — manejada en supabase_garantias.sql (tabla puede no existir aún) ─

-- ── PUJAS ─────────────────────────────────────────────────────────────────────
-- pujas se une con lotes para obtener casa_id
ALTER TABLE pujas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pujas_select" ON pujas;
DROP POLICY IF EXISTS "pujas_insert" ON pujas;
DROP POLICY IF EXISTS "pujas_update" ON pujas;

CREATE POLICY "pujas_select" ON pujas FOR SELECT
  USING (
    auth_is_admin()
    OR EXISTS (
      SELECT 1 FROM lotes l WHERE l.id = pujas.lote_id AND l.casa_id = auth_casa_id()
    )
  );

CREATE POLICY "pujas_insert" ON pujas FOR INSERT
  WITH CHECK (
    auth_is_admin()
    OR EXISTS (
      SELECT 1 FROM lotes l WHERE l.id = pujas.lote_id AND l.casa_id = auth_casa_id()
    )
  );

CREATE POLICY "pujas_update" ON pujas FOR UPDATE
  USING (
    auth_is_admin()
    OR EXISTS (
      SELECT 1 FROM lotes l WHERE l.id = pujas.lote_id AND l.casa_id = auth_casa_id()
    )
  );
