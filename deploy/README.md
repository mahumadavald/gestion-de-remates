# deploy/

Archivos para desplegar en infraestructura **externa** al stack Next.js/Supabase.

## gr-api.php

API PHP de sincronización entre TAKKA y el legacy de **Remates Ahumada**
(servidor en `rematesahumada.cl`).

**Qué hace:**
- `GET ?action=lookup_rut&rut=...` — busca un cliente en MySQL (`rematesa_remate.cliente`) por RUT.
- `POST ?action=sync` — upsert del cliente en MySQL + insert en `rematesa_participar.Participantes`.

**Dónde va:**
Subir a la raíz pública de `www.rematesahumada.cl` (o en `/api/gr-api.php`).

**Variables de entorno requeridas en ese servidor:**

| Variable | Descripción |
|---|---|
| `GR_API_TOKEN` | Token Bearer compartido con TAKKA |
| `DB_CLIENT_USER` | Usuario MySQL para `rematesa_remate` |
| `DB_CLIENT_PASS` | Contraseña MySQL para `rematesa_remate` |
| `DB_PARTICIPAR_USER` | Usuario MySQL para `rematesa_participar` |
| `DB_PARTICIPAR_PASS` | Contraseña MySQL para `rematesa_participar` |

**Estado:** Integración legacy activa — no eliminar hasta migrar el 100% de Ahumada a Supabase.
