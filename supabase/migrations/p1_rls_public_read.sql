-- P1: Lectura pública para páginas de catálogo y display
-- Aplicar DESPUÉS de p1_rls_casa_id.sql
--
-- Páginas públicas (sin auth):
--   /catalogo, /proximos-remates, /lotes
--
-- Páginas con auth requerida que leen estos datos:
--   /display/[slug] — verifica sesión antes de cargar datos

-- casas: lectura pública necesaria para lookup por slug en /display y /participar
DROP POLICY IF EXISTS "casas_public_select" ON casas;
CREATE POLICY "casas_public_select" ON casas
  FOR SELECT
  USING (true);

-- remates: lectura pública (próximos remates, catálogo)
DROP POLICY IF EXISTS "remates_public_select" ON remates;
CREATE POLICY "remates_public_select" ON remates
  FOR SELECT
  USING (true);

-- lotes: lectura pública (catálogo de lotes, display sala en vivo)
DROP POLICY IF EXISTS "lotes_public_select" ON lotes;
CREATE POLICY "lotes_public_select" ON lotes
  FOR SELECT
  USING (true);

-- pujas: lectura pública (display muestra historial de pujas del lote activo)
DROP POLICY IF EXISTS "pujas_public_select" ON pujas;
CREATE POLICY "pujas_public_select" ON pujas
  FOR SELECT
  USING (true);

-- sala_estado: lectura pública (display necesita saber idx y aState actual)
DROP POLICY IF EXISTS "sala_estado_public_select" ON sala_estado;
CREATE POLICY "sala_estado_public_select" ON sala_estado
  FOR SELECT
  USING (true);

-- usuarios: lectura por el propio usuario (display verifica roles del viewer)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_select_own" ON usuarios;
CREATE POLICY "usuarios_select_own" ON usuarios
  FOR SELECT
  USING (id = auth.uid() OR auth_is_admin());

-- postores: lectura solo de los propios registros (display verifica su propio acceso)
-- INSERT ya protegido via supabaseAdmin en /api/inscribir
DROP POLICY IF EXISTS "postores_select_own" ON postores;
DROP POLICY IF EXISTS "postores_public_select" ON postores;
CREATE POLICY "postores_select_own" ON postores
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR casa_id = auth_casa_id()
    OR auth_is_admin()
  );
