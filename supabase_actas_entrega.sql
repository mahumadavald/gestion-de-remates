-- Tabla actas_entrega — ejecutar en Supabase SQL Editor
-- Gestión digital de actas de entrega de bienes (liquidaciones simplificadas)

create table if not exists actas_entrega (
  id                  uuid primary key default gen_random_uuid(),
  casa_id             uuid references casas(id),
  bodega_id           uuid references bodegas(id),

  -- Identificación del caso
  rol_causa           text not null,          -- C-1340-2026
  juzgado             text,
  fecha_resolucion    text,                   -- 04-09-2026

  -- Deudor
  deudor_nombre       text not null,
  deudor_rut          text,
  deudor_telefono     text,
  deudor_email        text,
  deudor_profesion    text,
  deudor_empleador    text,
  deudor_remuneracion integer,
  excede_56_uf        boolean default false,

  -- Liquidador
  liquidador_nombre   text,
  liquidador_email    text,

  -- Inventario de bienes (array JSON: [{tipo, cantidad, descripcion, estado}])
  bienes              jsonb default '[]'::jsonb,

  -- Valores monetarios
  valores_monetarios  text,

  -- Cuentas / tarjetas
  cuentas_corrientes  boolean default false,
  tarjetas_credito    boolean default false,
  talonario_cheques   boolean default false,

  -- Otros
  sociedades          boolean default false,
  derechos_hereditarios boolean default false,
  otros_desc          text,

  -- Documentos entregados
  doc_cedula          boolean default false,
  doc_afp             boolean default false,
  doc_boleta_honorarios boolean default false,
  doc_anotaciones_vigentes boolean default false,
  doc_liquidaciones_sueldo boolean default false,
  doc_contrato_trabajo boolean default false,
  doc_carpeta_tributaria boolean default false,
  doc_otros           text,

  -- Flujo / estado
  -- pendiente: acta cargada, cliente aún no ha llegado
  -- por_recepcionar: se espera al cliente (fecha próxima o marcado manual)
  -- recepcionada: bienes recibidos y acta firmada digitalmente
  -- enviada_victor: notificación enviada para coordinar fecha de remate
  estado              text default 'pendiente'
    check (estado in ('pendiente','por_recepcionar','recepcionada','enviada_victor')),

  -- Fechas
  fecha_entrega_esperada date,               -- cuando debería llegar el cliente
  fecha_recepcion     timestamptz,           -- cuando se recepcionó
  recepcionado_por    text,                  -- nombre del admin que recepcionó
  fecha_enviada_victor timestamptz,

  -- Dirección de entrega
  direccion_entrega   text,

  -- Notas internas
  notas               text,

  -- Archivo adjunto original
  acta_url            text,

  created_at          timestamptz default now()
);

-- RLS: cada casa solo ve sus propias actas
alter table actas_entrega enable row level security;

create policy "actas_entrega_casa"
  on actas_entrega for all
  using (
    casa_id = (select casa_id from usuarios where id = auth.uid())
    or
    (select role from usuarios where id = auth.uid()) = 'admin'
  );

-- Índices
create index if not exists actas_entrega_casa_id    on actas_entrega(casa_id);
create index if not exists actas_entrega_bodega_id  on actas_entrega(bodega_id);
create index if not exists actas_entrega_estado     on actas_entrega(estado);
create index if not exists actas_entrega_rol_causa  on actas_entrega(rol_causa);
create index if not exists actas_entrega_created_at on actas_entrega(created_at desc);
