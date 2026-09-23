-- Módulo de Seguimiento de Causas Judiciales/Concursales
-- Ejecutar en Supabase SQL Editor

create table if not exists causas (
  id                    uuid primary key default gen_random_uuid(),
  casa_id               uuid references casas(id),
  tipo                  text not null default 'concursal' check (tipo in ('concursal','judicial')),
  rol                   text not null,
  tribunal              text,
  empresa_deudora       text,
  liquidador            text,
  bienes_descripcion    text,
  precio_base           numeric,
  comision_pct          numeric default 7,
  estado                text not null default 'notificada',
  acta_url              text,
  acta_nombre           text,
  remate_id             uuid references remates(id),
  lote_id               uuid,
  notas                 text,
  fecha_notificacion    date default current_date,
  fecha_aceptacion      date,
  fecha_recepcion_acta  date,
  fecha_recepcion_bienes date,
  fecha_solicitud_remate date,
  fecha_aprobacion_remate date,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- RLS
alter table causas enable row level security;
create policy "causas_authenticated" on causas for all to authenticated using (true) with check (true);

-- Columna causa_id en lotes (para vincular)
alter table lotes add column if not exists causa_id uuid references causas(id);

-- Índices
create index if not exists causas_casa_id_idx on causas(casa_id);
create index if not exists causas_estado_idx on causas(estado);
create index if not exists causas_rol_idx on causas(rol);
